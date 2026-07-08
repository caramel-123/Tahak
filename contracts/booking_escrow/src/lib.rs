#![no_std]

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, token, Address, Env, Symbol};

#[contracttype]
#[derive(Clone, PartialEq, Eq, Debug)]
pub enum Status {
    Created,
    Funded,
    Released,
    Refunded,
}

#[contracttype]
#[derive(Clone)]
pub struct Booking {
    pub tourist: Address,
    pub guide: Address,
    pub amount: i128,
    pub status: Status,
}

#[contracttype]
pub enum DataKey {
    Booking(Symbol),
    Token,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
pub enum Error {
    AlreadyExists = 1,
    NotFound = 2,
    WrongStatus = 3,
}

/// Holds a booking's payment in the contract's own balance of the
/// configured token (native XLM on testnet) until the tourist confirms
/// the tour is complete, mirroring the app's QR check-in milestone flow.
#[contract]
pub struct BookingEscrow;

#[contractimpl]
impl BookingEscrow {
    /// One-time setup: which token this deployment escrows (native XLM SAC on testnet).
    pub fn init(env: Env, token: Address) {
        env.storage().instance().set(&DataKey::Token, &token);
    }

    /// Tourist opens a booking for a guide at an agreed price. No funds move yet.
    pub fn create_booking(
        env: Env,
        booking_id: Symbol,
        tourist: Address,
        guide: Address,
        amount: i128,
    ) -> Result<(), Error> {
        tourist.require_auth();
        let key = DataKey::Booking(booking_id.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::AlreadyExists);
        }
        let booking = Booking {
            tourist,
            guide,
            amount,
            status: Status::Created,
        };
        env.storage().persistent().set(&key, &booking);
        Ok(())
    }

    /// Tourist funds escrow: amount moves from the tourist's wallet into the contract.
    pub fn fund(env: Env, booking_id: Symbol) -> Result<(), Error> {
        let key = DataKey::Booking(booking_id.clone());
        let mut booking: Booking = env.storage().persistent().get(&key).ok_or(Error::NotFound)?;
        if booking.status != Status::Created {
            return Err(Error::WrongStatus);
        }
        booking.tourist.require_auth();

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        token::Client::new(&env, &token_addr).transfer(
            &booking.tourist,
            &env.current_contract_address(),
            &booking.amount,
        );

        booking.status = Status::Funded;
        env.storage().persistent().set(&key, &booking);
        Ok(())
    }

    /// Tourist confirms the tour milestone is complete: funds move from the contract to the guide.
    pub fn release(env: Env, booking_id: Symbol) -> Result<(), Error> {
        let key = DataKey::Booking(booking_id.clone());
        let mut booking: Booking = env.storage().persistent().get(&key).ok_or(Error::NotFound)?;
        if booking.status != Status::Funded {
            return Err(Error::WrongStatus);
        }
        booking.tourist.require_auth();

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        token::Client::new(&env, &token_addr).transfer(
            &env.current_contract_address(),
            &booking.guide,
            &booking.amount,
        );

        booking.status = Status::Released;
        env.storage().persistent().set(&key, &booking);
        Ok(())
    }

    /// Tourist cancels a funded-but-not-yet-released booking: funds return to the tourist.
    pub fn refund(env: Env, booking_id: Symbol) -> Result<(), Error> {
        let key = DataKey::Booking(booking_id.clone());
        let mut booking: Booking = env.storage().persistent().get(&key).ok_or(Error::NotFound)?;
        if booking.status != Status::Funded {
            return Err(Error::WrongStatus);
        }
        booking.tourist.require_auth();

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        token::Client::new(&env, &token_addr).transfer(
            &env.current_contract_address(),
            &booking.tourist,
            &booking.amount,
        );

        booking.status = Status::Refunded;
        env.storage().persistent().set(&key, &booking);
        Ok(())
    }

    pub fn get_booking(env: Env, booking_id: Symbol) -> Option<Booking> {
        env.storage().persistent().get(&DataKey::Booking(booking_id))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    fn setup(env: &Env) -> (Address, token::StellarAssetClient<'_>, token::Client<'_>) {
        let admin = Address::generate(env);
        let sac = env.register_stellar_asset_contract_v2(admin.clone());
        let token_addr = sac.address();
        (
            token_addr.clone(),
            token::StellarAssetClient::new(env, &token_addr),
            token::Client::new(env, &token_addr),
        )
    }

    #[test]
    fn test_full_escrow_flow_moves_real_token_balances() {
        let env = Env::default();
        env.mock_all_auths();

        let (token_addr, token_admin, token_client) = setup(&env);
        let tourist = Address::generate(&env);
        let guide = Address::generate(&env);
        token_admin.mint(&tourist, &1_000);

        let contract_id = env.register(BookingEscrow, ());
        let client = BookingEscrowClient::new(&env, &contract_id);
        client.init(&token_addr);

        let booking_id = Symbol::new(&env, "TH2847");
        client.create_booking(&booking_id, &tourist, &guide, &500);
        assert_eq!(client.get_booking(&booking_id).unwrap().status, Status::Created);

        client.fund(&booking_id);
        assert_eq!(token_client.balance(&tourist), 500);
        assert_eq!(token_client.balance(&contract_id), 500);
        assert_eq!(client.get_booking(&booking_id).unwrap().status, Status::Funded);

        client.release(&booking_id);
        assert_eq!(token_client.balance(&guide), 500);
        assert_eq!(token_client.balance(&contract_id), 0);
        assert_eq!(client.get_booking(&booking_id).unwrap().status, Status::Released);
    }

    #[test]
    fn test_duplicate_booking_id_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let (token_addr, _, _) = setup(&env);
        let tourist = Address::generate(&env);
        let guide = Address::generate(&env);

        let contract_id = env.register(BookingEscrow, ());
        let client = BookingEscrowClient::new(&env, &contract_id);
        client.init(&token_addr);

        let booking_id = Symbol::new(&env, "DUP1");
        client.create_booking(&booking_id, &tourist, &guide, &500);

        let result = client.try_create_booking(&booking_id, &tourist, &guide, &500);
        assert_eq!(result, Err(Ok(Error::AlreadyExists)));
    }

    #[test]
    fn test_release_before_funding_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let (token_addr, _, _) = setup(&env);
        let tourist = Address::generate(&env);
        let guide = Address::generate(&env);

        let contract_id = env.register(BookingEscrow, ());
        let client = BookingEscrowClient::new(&env, &contract_id);
        client.init(&token_addr);

        let booking_id = Symbol::new(&env, "NOFUND");
        client.create_booking(&booking_id, &tourist, &guide, &500);

        let result = client.try_release(&booking_id);
        assert_eq!(result, Err(Ok(Error::WrongStatus)));
    }

    #[test]
    fn test_refund_returns_funds_to_tourist() {
        let env = Env::default();
        env.mock_all_auths();
        let (token_addr, token_admin, token_client) = setup(&env);
        let tourist = Address::generate(&env);
        let guide = Address::generate(&env);
        token_admin.mint(&tourist, &1_000);

        let contract_id = env.register(BookingEscrow, ());
        let client = BookingEscrowClient::new(&env, &contract_id);
        client.init(&token_addr);

        let booking_id = Symbol::new(&env, "REFUND1");
        client.create_booking(&booking_id, &tourist, &guide, &300);
        client.fund(&booking_id);
        assert_eq!(token_client.balance(&tourist), 700);

        client.refund(&booking_id);
        assert_eq!(token_client.balance(&tourist), 1_000);
        assert_eq!(token_client.balance(&contract_id), 0);
        assert_eq!(client.get_booking(&booking_id).unwrap().status, Status::Refunded);
    }
}

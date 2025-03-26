use crate::{Config, config::get_config_path};

pub fn config(_config: Config) -> Result<(), crate::JumpStartError> {
    println!("{}", get_config_path().display());
    Ok(())
}

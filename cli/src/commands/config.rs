use crate::{Config, config::get_config_path};
use anyhow::Result;

pub fn config(_config: Config) -> Result<()> {
    println!("{}", get_config_path().display());
    Ok(())
}

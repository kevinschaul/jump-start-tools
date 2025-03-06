use crate::{Config, config::get_config_path};

pub fn config(_config: Config) {
    println!("{}", get_config_path().display());
}

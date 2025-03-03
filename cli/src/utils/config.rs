use crate::{Config, JumpStartInstance};

/// Get the default instance, or the first instance if none is marked default
pub fn get_default_instance(config: &Config) -> &JumpStartInstance {
    config
        .instances
        .iter()
        .find(|i| i.default.unwrap_or(false))
        .unwrap_or(&config.instances[0])
}

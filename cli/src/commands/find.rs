use crate::Config;

pub fn find(_config: Config, search_term: &String) -> Result<(), crate::JumpStartError> {
    println!("Finding {search_term}");
    Ok(())
}

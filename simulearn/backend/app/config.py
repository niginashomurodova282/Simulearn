from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    database_url: str = "sqlite:///./simulearn.db"
    jwt_secret: str = "dev-only-change-me"
    jwt_minutes: int = 60 * 24 * 7
    cors_origins: str = "http://localhost:5173"
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-5-5"


settings = Settings()

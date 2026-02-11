from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./tender.db"
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    DEBUG: bool = False

    # License server (License_key_server)
    LICENSE_SERVER_URL: str = ""  # e.g. http://localhost:8001
    LICENSE_PRODUCT_NAME: str = "TenderSystem"
    LICENSE_KEY: str = ""  # Optional: set in env for initial setup

    class Config:
        env_file = ".env"


settings = Settings()

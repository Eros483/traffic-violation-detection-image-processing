# ----- central management for app settings @ utils/config.py -----

import os
from pathlib import Path
from typing import Any, Dict

import yaml
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    """
    Central management for settings and configurations
    Reads .env file
    """

    kaggle_username: str = ""
    kaggle_key: str = ""
    groq_api_key: str = ""

    yaml_config: Dict[str, Any] = {}

    def load_yaml(self, yaml_path: str = "configs/config.yaml") -> None:
        """Loads the YAML configuration file into the settings object."""
        path = Path(yaml_path)
        if path.exists():
            with open(path, "r") as f:
                self.yaml_config = yaml.safe_load(f)

    def get_yaml(self, key_path: str, default: Any = None) -> Any:
        """
        Helper to fetch nested yaml config values.
        Example: config.get_yaml('models.detector.confidence_threshold', 0.5)
        """
        keys = key_path.split(".")
        val = self.yaml_config
        for key in keys:
            if isinstance(val, dict) and key in val:
                val = val[key]
            else:
                return default
        return val


config = Settings()
config.load_yaml()
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


class CallsignModel(BaseModel):
    callsign: str = Field(min_length=3, max_length=16, pattern=r"^[A-Za-z0-9/]+$")

    @field_validator("callsign")
    @classmethod
    def normalize_callsign(cls, value: str) -> str:
        return value.strip().upper().replace("Ø", "0")


class GatewayBandCreate(BaseModel):
    band: str = Field(min_length=1, max_length=16)
    frequency: str = Field(default="", max_length=24)

    @field_validator("band", "frequency")
    @classmethod
    def normalize_band_details(cls, value: str) -> str:
        return value.strip()


class GatewaySessionCreate(CallsignModel):
    bands: list[GatewayBandCreate] = Field(min_length=3, max_length=3)
    qth: str = Field(min_length=1, max_length=64)
    question: str = Field(default="", max_length=280)
    announcement: str = Field(default="", max_length=280)
    scheduled: bool = False

    @model_validator(mode="after")
    def validate_band_plan(self):
        names = [item.band.casefold().replace(" ", "") for item in self.bands]
        if names[0] != "80m" or names[1] != "40m" or names[2] not in {"20m", "15m", "10m"}:
            raise ValueError("Bands must be 80m, 40m, then 20m, 15m, or 10m")
        return self

    @field_validator("question")
    @classmethod
    def normalize_question(cls, value: str) -> str:
        return value.strip().upper()


class GatewayBandUpdate(CallsignModel):
    frequency: Optional[str] = Field(default=None, max_length=24)
    question: Optional[str] = Field(default=None, max_length=280)
    announcement: Optional[str] = Field(default=None, max_length=280)
    ncsCallsign: Optional[str] = Field(default=None, max_length=16)
    ncsQth: Optional[str] = Field(default=None, max_length=64)

    @field_validator("question")
    @classmethod
    def normalize_optional_question(cls, value: Optional[str]) -> Optional[str]:
        return value.strip().upper() if value is not None else None


class GatewayCheckinCreate(CallsignModel):
    enteredBy: str = Field(min_length=3, max_length=16, pattern=r"^[A-Za-z0-9/]+$")
    preferredSpeed: Optional[int] = Field(default=None, ge=1, le=100)
    checkinType: Literal["direct", "online"] = "direct"
    relayedBy: str = Field(default="", max_length=16)

    @field_validator("enteredBy", "relayedBy")
    @classmethod
    def normalize_other_callsign(cls, value: str) -> str:
        return value.strip().upper().replace("Ø", "0")


class GatewayChatCreate(CallsignModel):
    message: str = Field(min_length=1, max_length=50)

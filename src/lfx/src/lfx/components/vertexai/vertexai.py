from typing import Any, cast

from lfx.base.models.model import LCModelComponent
from lfx.field_typing import LanguageModel
from lfx.io import (
    BoolInput,
    FloatInput,
    IntInput,
    MessageTextInput,
    OAuthProviderInput,
    StrInput,
)


class ChatVertexAIComponent(LCModelComponent):
    display_name = "Vertex AI"
    description = "Generate text using Vertex AI LLMs."
    icon = "VertexAI"
    name = "VertexAiModel"

    inputs = [
        *LCModelComponent.get_base_inputs(),
        OAuthProviderInput(
            name="oauth_provider_id",
            display_name="OAuth Provider",
            info=(
                "Select a configured Google OAuth provider for authentication. "
                "Leave empty to fall back to Application Default Credentials."
            ),
            provider_filter=["google"],
        ),
        MessageTextInput(name="model_name", display_name="Model Name", value="gemini-1.5-pro"),
        StrInput(name="project", display_name="Project", info="The project ID.", advanced=True),
        StrInput(name="location", display_name="Location", value="us-central1", advanced=True),
        IntInput(name="max_output_tokens", display_name="Max Output Tokens", advanced=True),
        IntInput(name="max_retries", display_name="Max Retries", value=1, advanced=True),
        FloatInput(name="temperature", value=0.0, display_name="Temperature"),
        IntInput(name="top_k", display_name="Top K", advanced=True),
        FloatInput(name="top_p", display_name="Top P", value=0.95, advanced=True),
        BoolInput(name="verbose", display_name="Verbose", value=False, advanced=True),
    ]

    def build_model(self) -> LanguageModel:
        try:
            from langchain_google_vertexai import ChatVertexAI
        except ImportError as e:
            msg = "Please install the langchain-google-vertexai package to use the Vertex AI component."
            raise ImportError(msg) from e

        location = self.location or None
        project: str | None = self.project or None
        credentials = None

        if self.oauth_provider_id:
            credentials, project = self._credentials_from_oauth_provider(project)

        if credentials is not None or project is not None:
            from google.cloud import aiplatform

            aiplatform.init(project=project, location=location, credentials=credentials)

        return cast(
            "LanguageModel",
            ChatVertexAI(
                credentials=credentials,
                location=location,
                project=project,
                max_output_tokens=self.max_output_tokens or None,
                max_retries=self.max_retries,
                model_name=self.model_name,
                temperature=self.temperature,
                top_k=self.top_k or None,
                top_p=self.top_p,
                verbose=self.verbose,
            ),
        )

    def _credentials_from_oauth_provider(self, project: str | None) -> tuple[Any, str | None]:
        """Build a Google credentials object from the selected OAuth provider.

        Returns a ``(credentials, project)`` tuple. ``project`` may be updated
        when the service-account JSON contains a ``project_id`` field.
        """
        if not self.oauth_provider_id:
            msg = "OAuth Provider is required. Select one in the component settings."
            raise ValueError(msg)

        info = self.get_oauth_provider_info(self.oauth_provider_id)
        if info is None:
            msg = (
                f"OAuth provider '{self.oauth_provider_id}' not found or is not accessible. "
                "Make sure the provider is configured and active in Settings → OAuth Providers."
            )
            raise ValueError(msg)

        flow_type = info.get("flow_type", "")

        if flow_type == "service_account":
            import json

            from google.oauth2 import service_account

            extra_data = info.get("extra_data")
            if isinstance(extra_data, str):
                extra_data = json.loads(extra_data)
            if not extra_data:
                msg = (
                    f"OAuth provider '{info.get('name', self.oauth_provider_id)}' is configured as a "
                    "Service Account but the JSON key data is missing. Re-save the provider with valid credentials."
                )
                raise ValueError(msg)
            creds = service_account.Credentials.from_service_account_info(extra_data)
            return creds, project or extra_data.get("project_id")

        access_token = info.get("access_token")
        if not access_token:
            provider_name = info.get("name", self.oauth_provider_id)
            msg = (
                f"No valid access token available from OAuth provider '{provider_name}'. "
                "Try rotating the token in Settings → OAuth Providers."
            )
            raise ValueError(msg)

        from google.oauth2.credentials import Credentials

        return Credentials(token=access_token), project

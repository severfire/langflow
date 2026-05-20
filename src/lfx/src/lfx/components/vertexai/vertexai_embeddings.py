from typing import Any

from lfx.base.models.model import LCModelComponent
from lfx.field_typing import Embeddings
from lfx.io import BoolInput, FloatInput, IntInput, MessageTextInput, OAuthProviderInput, Output


class VertexAIEmbeddingsComponent(LCModelComponent):
    display_name = "Vertex AI Embeddings"
    description = "Generate embeddings using Google Cloud Vertex AI models."
    icon = "VertexAI"
    name = "VertexAIEmbeddings"

    inputs = [
        OAuthProviderInput(
            name="oauth_provider_id",
            display_name="OAuth Provider",
            info=(
                "Select a configured Google OAuth provider for authentication. "
                "Leave empty to fall back to Application Default Credentials."
            ),
            provider_filter=["google"],
        ),
        MessageTextInput(name="location", display_name="Location", value="us-central1", advanced=True),
        MessageTextInput(name="project", display_name="Project", info="The project ID.", advanced=True),
        IntInput(name="max_output_tokens", display_name="Max Output Tokens", advanced=True),
        IntInput(name="max_retries", display_name="Max Retries", value=1, advanced=True),
        MessageTextInput(name="model_name", display_name="Model Name", value="textembedding-gecko", required=True),
        IntInput(name="n", display_name="N", value=1, advanced=True),
        IntInput(name="request_parallelism", value=5, display_name="Request Parallelism", advanced=True),
        MessageTextInput(name="stop_sequences", display_name="Stop", advanced=True, is_list=True),
        BoolInput(name="streaming", display_name="Streaming", value=False, advanced=True),
        FloatInput(name="temperature", value=0.0, display_name="Temperature"),
        IntInput(name="top_k", display_name="Top K", advanced=True),
        FloatInput(name="top_p", display_name="Top P", value=0.95, advanced=True),
    ]

    outputs = [
        Output(display_name="Embeddings", name="embeddings", method="build_embeddings"),
    ]

    def build_embeddings(self) -> Embeddings:
        try:
            from langchain_google_vertexai import VertexAIEmbeddings
        except ImportError as e:
            msg = "Please install the langchain-google-vertexai package to use the VertexAIEmbeddings component."
            raise ImportError(msg) from e

        gcloud_credentials = None
        project = self.project or None

        if self.oauth_provider_id:
            gcloud_credentials, project = self._credentials_from_oauth_provider(project)

        return VertexAIEmbeddings(
            credentials=gcloud_credentials,
            location=self.location,
            max_output_tokens=self.max_output_tokens or None,
            max_retries=self.max_retries,
            model_name=self.model_name,
            n=self.n,
            project=project,
            request_parallelism=self.request_parallelism,
            stop=self.stop_sequences or None,
            streaming=self.streaming,
            temperature=self.temperature,
            top_k=self.top_k or None,
            top_p=self.top_p,
        )

    def _credentials_from_oauth_provider(self, project: str | None) -> tuple[Any, str | None]:
        """Build a Google credentials object from the selected OAuth provider."""
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

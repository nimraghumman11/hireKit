FROM python:3.11-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
# Slow networks / large wheels: default pip timeout is too low for big downloads
ENV PIP_DEFAULT_TIMEOUT=600

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libglib2.0-0 \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libpangocairo-1.0-0 \
    libcairo2 \
    libcairo-gobject2 \
    libffi-dev \
    libharfbuzz0b \
    libfontconfig1 \
    fonts-liberation \
    && ldconfig \
    && rm -rf /var/lib/apt/lists/* \
    # WeasyPrint's cffi binding looks for 'pangoft2-1.0-0' → maps to libpangoft2-1.0-0.so,
    # but newer libpango ships the file as libpangoft2-1.0.so.0. Create symlinks so cffi finds them.
    && ln -sf /usr/lib/x86_64-linux-gnu/libpangoft2-1.0.so.0 /usr/lib/x86_64-linux-gnu/libpangoft2-1.0-0.so \
    && ln -sf /usr/lib/x86_64-linux-gnu/libpangocairo-1.0.so.0 /usr/lib/x86_64-linux-gnu/libpangocairo-1.0-0.so \
    && ln -sf /usr/lib/x86_64-linux-gnu/libpango-1.0.so.0 /usr/lib/x86_64-linux-gnu/libpango-1.0-0.so

COPY requirements.txt .
# sentence-transformers depends on torch. PyPI's default torch wheel pulls CUDA + NVIDIA
# packages (~1GB+). Install CPU-only torch first from PyTorch's index to keep the image
# smaller and avoid pip read timeouts on slower links.
RUN python -m pip install --no-cache-dir --upgrade "pip<26" setuptools wheel \
    && python -m pip install --no-cache-dir --retries 10 \
       torch --index-url https://download.pytorch.org/whl/cpu \
    && python -m pip install --no-cache-dir --retries 10 --prefer-binary -r requirements.txt

COPY . .

# Pre-download the tiktoken cl100k_base encoding so the first request never
# stalls on a network call to openaipublic.blob.core.windows.net.
RUN python -c "import tiktoken; tiktoken.get_encoding('cl100k_base')" || true

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

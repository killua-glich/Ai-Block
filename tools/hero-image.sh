#!/bin/zsh
# Make a hero image for the site with the local Qwen-Image-2.1 model (mflux, 4-bit).
#
#   tools/hero-image.sh "prompt" [output.png] [width] [height] [steps] [seed]
#
# Defaults: public/hero.png, 1280x544, 16 steps, random seed.
# Needs: mflux (uv tool install --python 3.12 mflux) and the model in ~/ImageModels.
# Close big LLMs in LM Studio first: the model needs about 5 GB of GPU memory.

set -e
PROMPT="${1:?usage: tools/hero-image.sh \"prompt\" [output.png] [width] [height] [steps] [seed]}"
OUT="${2:-public/hero.png}"
WIDTH="${3:-1280}"
HEIGHT="${4:-544}"
STEPS="${5:-16}"
SEED="${6:-$RANDOM}"
MODEL="$HOME/ImageModels/Qwen-Image-2.1-MLX-4bit"

mkdir -p "$(dirname "$OUT")"
"$HOME/.local/bin/mflux-generate-qwen-2.1" \
  --model "$MODEL" --base-model qwen-2.1 \
  --prompt "$PROMPT" \
  --width "$WIDTH" --height "$HEIGHT" --steps "$STEPS" --seed "$SEED" \
  --low-ram --output "$OUT"
echo "Saved $OUT (seed $SEED)"

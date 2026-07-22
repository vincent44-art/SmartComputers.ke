"""Self-hosted placeholder image endpoint.

Replaces external services like picsum.photos so that SSR image fetching
never hangs due to an unreachable external host.
"""

from __future__ import annotations

import textwrap

from flask import Blueprint, Response, request

placeholder_bp = Blueprint("placeholder", __name__, url_prefix="/api/placeholder")


def _svg_placeholder(
    width: int,
    height: int,
    text: str = "",
    bg_color: str = "#E2E8F0",
    fg_color: str = "#64748B",
) -> str:
    """Generate an inline SVG placeholder image with centered text."""
    # Sanitise text to avoid breaking SVG content
    safe_text = text.replace("&", "&amp;").replace("<", "<").replace(">", ">")
    # Truncate long text to fit
    if len(safe_text) > 60:
        safe_text = safe_text[:57] + "..."

    # Scale font relative to image size
    font_size = max(12, min(width, height) // 12)

    return textwrap.dedent(f"""\
    <svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
      <rect width="{width}" height="{height}" fill="{bg_color}"/>
      <circle cx="{width//2}" cy="{height//3}" r="{min(width, height)//6}" fill="{fg_color}" opacity="0.15"/>
      <circle cx="{width*2//3}" cy="{height*2//3}" r="{min(width, height)//5}" fill="{fg_color}" opacity="0.10"/>
      <text x="{width//2}" y="{height//2}" font-family="system-ui, -apple-system, sans-serif" font-size="{font_size}" fill="{fg_color}" text-anchor="middle" dominant-baseline="central" text-decoration="none">
        <tspan x="{width//2}" dy="0">{safe_text or "No Image"}</tspan>
        <tspan x="{width//2}" dy="{font_size * 1.6}" font-size="{font_size * 0.7}" fill="{fg_color}" opacity="0.6">{width} x {height}</tspan>
      </text>
    </svg>""")


@placeholder_bp.get("/<int:width>/<int:height>")
def placeholder_image(width: int, height: int):
    """Return an SVG placeholder image.

    Query params:
        text (str): Optional text overlay.
        bg   (str): Background color hex (default E2E8F0).
        fg   (str): Foreground/text color hex (default 64748B).
    """
    # Clamp dimensions to reasonable values
    width = max(100, min(width, 1920))
    height = max(100, min(height, 1080))

    text = request.args.get("text", "")
    bg = request.args.get("bg", "#E2E8F0")
    fg = request.args.get("fg", "#64748B")

    svg = _svg_placeholder(width, height, text, bg, fg)
    return Response(svg, mimetype="image/svg+xml", status=200)


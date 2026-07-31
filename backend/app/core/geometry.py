import fitz


ANCHOR_POINTS = {
    "top_left": lambda r: (r.x0, r.y0),
    "top_right": lambda r: (r.x1, r.y0),
    "bottom_left": lambda r: (r.x0, r.y1),
    "bottom_right": lambda r: (r.x1, r.y1),
    "center": lambda r: (
        (r.x0 + r.x1) / 2,
        (r.y0 + r.y1) / 2,
    ),
}


def get_anchor_position(rect: fitz.Rect, anchor_point: str):
    """
    รับตำแหน่ง Anchor แล้วคืนค่า (x, y)
    """

    if anchor_point not in ANCHOR_POINTS:
        raise ValueError(f"Unknown anchor_point: {anchor_point}")

    return ANCHOR_POINTS[anchor_point](rect)
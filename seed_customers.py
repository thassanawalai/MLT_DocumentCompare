"""Run the backend customer workbook importer from the repository root."""
from pathlib import Path
import runpy


if __name__ == "__main__":
    runpy.run_path(
        str(Path(__file__).resolve().parent / "backend" / "scripts" / "seed_customers.py"),
        run_name="__main__",
    )

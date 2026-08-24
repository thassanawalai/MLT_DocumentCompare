import unittest

from app.core.pdf_parser import find_anchor_case_sensitive


class _PageWithControlSeparatedAnchor:
    def search_for(self, _anchor):
        return []

    def get_text(self, mode, **_kwargs):
        assert mode == "words"
        return [
            (10, 20, 95, 30, f"BILL{chr(4)}OF{chr(4)}LADING{chr(4)}NO.", 0, 0, 0),
        ]


class FindAnchorCaseSensitiveTests(unittest.TestCase):
    def test_finds_anchor_with_pdf_control_character_separators(self):
        page = _PageWithControlSeparatedAnchor()

        rect = find_anchor_case_sensitive(page, "BILL OF LADING NO.")

        self.assertEqual(rect, (10, 20, 95, 30))


if __name__ == "__main__":
    unittest.main()

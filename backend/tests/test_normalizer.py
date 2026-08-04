import unittest

from app.core.normalizer import normalize_text


class NormalizeTextTests(unittest.TestCase):
    def test_port_comma_and_line_break_are_equivalent(self):
        original = normalize_text("LAEM CHABANG, THAILAND", commas_as_whitespace=True)
        wrapped = normalize_text("LAEM CHABANG \nTHAILAND", commas_as_whitespace=True)

        self.assertEqual(original, wrapped)

    def test_regular_fields_keep_comma_significant(self):
        with_comma = normalize_text("REF, 123")
        without_comma = normalize_text("REF 123")

        self.assertNotEqual(with_comma, without_comma)

    def test_unicode_and_invisible_whitespace_are_normalized(self):
        self.assertEqual(
            normalize_text("LAEM\u00A0CHABANG,\u200B THAILAND", commas_as_whitespace=True),
            "LAEM CHABANG THAILAND",
        )


if __name__ == "__main__":
    unittest.main()

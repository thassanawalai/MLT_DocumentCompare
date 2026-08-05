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

    def test_repeated_symbol_noise_is_removed_without_merging_words(self):
        self.assertEqual(normalize_text("LAEM---CHABANG"), "LAEM CHABANG")
        self.assertEqual(normalize_text("PORT...THAILAND"), "PORT THAILAND")
        self.assertEqual(normalize_text("LAEM***CHABANG"), "LAEM CHABANG")

    def test_ordinary_reference_punctuation_is_preserved(self):
        self.assertEqual(normalize_text("AB-123/45"), "AB-123/45")


if __name__ == "__main__":
    unittest.main()

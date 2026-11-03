# Offering color and booking choices

The offering editor displays 16 named color swatches with a checkmark, keyboard focus and an immediate calendar chip preview. A single hidden field submits the selected palette key. Existing keys remain valid and the shared calendar renderer uses the revised offering palette. Rider level colors retain their separate palette.

New offerings expose pay-per-booking and Included in subscription. The latter uses the existing subscription or package eligibility check. Existing free offerings can retain their no-charge booking option when edited.

No schema migration, configuration or dependency change. Restore the previous source version to roll back the UI. Offerings saved with a newly introduced color key will use the prior version's fallback until the palette is restored.

Base Sites source 5bcb70d5a45acea5c8c3db15c8bd8d005945b3b4 and GitHub main 51a54154ea4b185b4ecd0452ee9dc5710cbb41f9. Browser layout and interaction QA remain unverified.

# Selection controls

Use the shared SuitableLevels checklist for horse/trainer suitability, which can include several academy-defined levels. All rider levels is an explicit choice; otherwise at least one checkbox must be selected. Preserve custom/saved labels in the list. Keep a rider’s own assigned level as one value; it describes their current progression rather than resource suitability.

Persist suitability as suitableLevels arrays and evaluate through allowsRiderLevel across UI suggestions, portal eligibility and server booking/enrollment checks. Do not introduce another single-level horse/trainer dropdown or reimplement hard-coded Beginner/Advanced rules. Legacy horse records retain the former server behavior until explicitly saved with a checklist; the editor preselects their prior label. No bulk migration changes existing bookings.

New multiple-choice controls should reuse the appropriate existing checklist with an explicit all/none meaning. Single-value states and single-valued relationships retain selects. This avoids changing data cardinality merely for visual consistency.

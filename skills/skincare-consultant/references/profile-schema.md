# Skin profile schema

Collect the minimum information needed for the current task. Health-related fields are sensitive; explain why they matter and let the user decline optional fields.

## Identity and provenance

- Profile ID or display name
- Created and last-updated timestamps
- Preferred language and region
- Evidence sources: user report, clinician diagnosis, analysis report, image observation, or prior record
- Confidence and unresolved questions

## Skin characteristics

- Self-described type: oily, dry, combination, balanced, or unsure
- Sensitivity and reactivity
- Current barrier state: comfortable, tight, flaky, stinging, or irritated
- Main concerns and affected areas
- Typical breakout pattern, if relevant
- Known diagnosed conditions, clearly labeled as clinician-diagnosed
- Fitzpatrick type only when volunteered or specifically relevant; never infer ethnicity from an image

## Safety context

- Allergies and known ingredient reactions
- Prescription and over-the-counter skin treatments
- Recent procedures or treatments
- Pregnancy, trying to conceive, or breastfeeding when relevant to active ingredients
- Eye-area sensitivity, shaving, broken skin, or active wounds when relevant

Do not advise stopping or changing prescribed treatment. Direct medication, pregnancy, and procedure questions to the appropriate clinician or pharmacist.

## Goals and environment

- Ranked goals
- Climate, humidity, season, and typical sun exposure
- Work or lifestyle exposures when relevant
- Budget and product-access region
- Texture, fragrance, finish, and routine-length preferences

## Current routine

For every product record:

- Exact name, brand, formula region, and source
- Status: owned, considering, finished, stopped, or unknown
- AM/PM placement and frequency
- Start/stop dates when known
- Purpose and meaningful actives
- Observed benefits, adverse reactions, and confidence
- Purchase or repurchase intent

## Update rules

1. Preserve user-reported facts verbatim where useful and label interpretations separately.
2. Timestamp changes and append reaction/history events instead of erasing them.
3. Ask before replacing contradictory information.
4. Treat temporary irritation as an event, not automatically as a permanent skin type.
5. Reassess the profile after major routine changes, climate changes, procedures, or clinician diagnoses.
6. Do not infer a diagnosis, allergy, pregnancy status, or skin type from a photo.

## Commercial reports and images

Record the provider, report date, method if known, scores, and limitations. Store the original link or screenshot reference when the user approves. Translate scores into neutral observations, not diagnoses. A single image or commercial score must not override symptoms, longitudinal history, or clinician findings.

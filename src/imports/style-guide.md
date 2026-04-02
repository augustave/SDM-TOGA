style_guide:
  meta:
    title: "Art Director Style Guide — Administrative Modernism"
    version: "1.0"
    status: "Foundational"
    source_image_role: "Primary visual precedent and non-negotiable aesthetic anchor"
    intended_users:
      - "Art Director"
      - "Artist UX Designer"
      - "Visual Designers"
      - "Developers"
      - "Content Creators"

  executive_summary:
    style_name: "Administrative Modernism"
    core_impression: "Austere, intelligent, archival, procedural, quiet"
    one_sentence_mandate: "Design every surface as if it were a precise institutional document elevated into a controlled art object."
    design_keywords:
      - "Swiss"
      - "archival"
      - "bureaucratic"
      - "diagrammatic"
      - "dry"
      - "precise"
      - "spacious"
      - "unemotional"
      - "structural"

  visual_dna:
    mood:
      emotional_temperature: "cool-neutral"
      energy_level: "low"
      authority_level: "high"
      human_presence: "minimal"
    aesthetic_character:
      - "Large empty fields dominate the composition"
      - "Information sits inside a rigid structural system"
      - "Hairline rules do most of the visual work"
      - "Typography feels clerical, not expressive"
      - "Geometry creates hierarchy more than color does"
      - "The page should feel like evidence, not advertising"

  non_negotiable_rules:
    - "Use monochrome or near-monochrome palettes only"
    - "Favor hairline rules over filled shapes"
    - "Let empty space carry authority"
    - "Keep typography small, dry, and disciplined"
    - "Use asymmetry with strict alignment"
    - "Every line must appear functional, never decorative"
    - "No visual warmth, brand flourish, or lifestyle polish"
    - "No gradients, glossy UI effects, or soft consumer-product aesthetics"

  color_system:
    strategy: "Monochrome-first with minimal tonal contrast"
    palette:
      paper:
        hex: "#E9E9E7"
        usage: "Primary background"
      paper_shadow:
        hex: "#D8D8D4"
        usage: "Panels, subtle separation, hover states if digital"
      graphite:
        hex: "#4A4A46"
        usage: "Primary text, rules, data labels"
      soft_black:
        hex: "#222222"
        usage: "Highest emphasis only"
      faint_rule:
        hex: "#BEBEB8"
        usage: "Secondary dividers, quiet grid lines"
    ratio:
      background_and_empty_space: "80-90%"
      rules_and_structure: "7-15%"
      high_emphasis_text: "1-5%"
    contrast_note: "Contrast should remain sufficient for readability, but never feel loud."

  typography:
    principle: "Type should feel administrative, tabular, and matter-of-fact"
    preferred_styles:
      primary:
        category: "Monospaced or typewriter-like sans/mono"
        character: "Narrow, technical, modest, slightly mechanical"
      secondary:
        category: "Neutral grotesk sans"
        character: "Only when needed for digital legibility"
    hierarchy:
      metadata_header:
        size: "10-12px digital / 7-9pt print"
        weight: "regular"
        case: "mixed or uppercase fragments"
        spacing: "tight"
      body_data:
        size: "11-13px digital / 8-9pt print"
        weight: "regular"
        spacing: "tight"
      section_label:
        size: "11-13px digital / 8-9pt print"
        weight: "medium"
        emphasis_method: "position and isolation, not bold styling"
      totals_or_key_values:
        size: "same as body or +1 step only"
        weight: "medium"
        emphasis_method: "alignment and placement"
    rules:
      - "Do not build hierarchy with many font sizes"
      - "Avoid expressive italics"
      - "Avoid oversized headlines"
      - "Use tabular numerals whenever possible"
      - "Prefer alignment, spacing, and boxes over boldness"

  layout_system:
    page_logic: "A4/portrait administrative sheet translated into digital modules"
    composition_model:
      - "Top bands for metadata"
      - "Large central negative space"
      - "Geometric divider as major directional gesture"
      - "Bottom or lower-right compartment for structured data"
      - "Footer reserved for institutional details"
    grid:
      base: "Strict modular grid"
      columns: 2
      behavior: "Asymmetric occupancy; one side may remain largely empty"
    spacing:
      outer_margin: "Generous"
      internal_padding: "Tight and disciplined"
      whitespace_role: "Primary compositional material"
    alignment:
      - "Hard left alignment for most text"
      - "Numeric data aligned in columns"
      - "Boxes must snap to grid"
      - "Diagonal elements may break orthogonality once, and only once, as a structural event"

  line_and_shape_language:
    line_weight:
      primary_rule: "1px digital / 0.5pt print"
      secondary_rule: "0.5-1px digital / 0.25-0.35pt print"
    line_behavior:
      - "Straight only"
      - "No rounded corners"
      - "No ornamental strokes"
      - "Diagonals are rare and architectonic"
    shapes:
      - "Rectangles, bands, table cells"
      - "Open frames preferred over filled blocks"
      - "Boxes should look drafted, not designed for delight"

  texture_and_materiality:
    material_reference: "Photocopied office paper, archival printout, technical sheet"
    desired_surface_quality:
      - "Slightly dry"
      - "Flat"
      - "Barely tactile"
      - "No polished digital sheen"
    optional_effects:
      - "Very subtle paper grain"
      - "Slight print softness"
      - "Faint scan-like imperfection"
    forbidden_effects:
      - "Heavy noise"
      - "Vintage nostalgia filters"
      - "Luxury paper simulation"
      - "Visible 3D depth"

  image_treatment:
    policy: "Imagery is secondary to structure"
    if_images_are_used:
      - "Monochrome or desaturated"
      - "Documentary, diagrammatic, or evidentiary"
      - "Placed inside strict frames"
      - "No full-bleed emotional photography"
    preferred_visual_types:
      - "Scans"
      - "technical diagrams"
      - "tables"
      - "cropped document fragments"
      - "archival references"

  iconography_and_graphics:
    icon_style: "Minimal, technical, skeletal"
    rules:
      - "Use only if functionally necessary"
      - "Prefer line icons over filled icons"
      - "Match rule weight to layout lines"
      - "Avoid playful, rounded, or friendly icons"

  ux_translation:
    principle: "The experience should feel controlled and legible, never decorative"
    for_artist_ux_designer:
      hierarchy_method:
        - "Use structure before color"
        - "Use space before typography size"
        - "Use grouping before ornament"
      interaction_model:
        - "Calm, low-motion interfaces"
        - "Minimal transitions"
        - "State changes should appear as document updates, not animated spectacle"
      navigation_behavior:
        - "Sectional and procedural"
        - "Clear compartments and status labels"
        - "Information should feel filed, not floating"
      usability_guardrails:
        - "Maintain readability despite small type aesthetics"
        - "Do not let conceptual austerity reduce task clarity"
        - "Interactive zones must remain obvious through layout and labeling"
        - "Tables, metadata, and forms should feel authoritative but easy to scan"

  motion_guidelines:
    default_motion: "Nearly static"
    allowed_motion:
      - "Soft fades"
      - "Subtle line reveals"
      - "Gentle panel replacement"
    forbidden_motion:
      - "Bouncy motion"
      - "parallax"
      - "liquid effects"
      - "hero animations"
      - "playful microinteractions"
    timing:
      enter: "120-200ms"
      exit: "80-160ms"
      easing: "linear or near-linear"

  voice_and_content_presentation:
    tone:
      - "factual"
      - "brief"
      - "institutional"
      - "unromantic"
    content_rules:
      - "Label clearly"
      - "Use concise descriptors"
      - "Avoid marketing tone"
      - "Avoid emotional copy unless the project explicitly demands contrast"

  do_not_do:
    - "Do not turn this into a trendy brutalist poster"
    - "Do not beautify the bureaucracy away"
    - "Do not add expressive color accents unless explicitly authorized"
    - "Do not use oversized editorial typography"
    - "Do not center everything"
    - "Do not fill empty space just because it feels sparse"
    - "Do not soften the system with friendly UX clichés"

  acceptance_criteria:
    art_direction_checks:
      - "Does the composition feel governed by structure rather than decoration?"
      - "Is the page mostly empty yet still intentional?"
      - "Do the lines feel precise and necessary?"
      - "Is the overall impression institutional, not commercial?"
    ux_checks:
      - "Can a user scan key information quickly?"
      - "Are interactive or important zones clear without loud styling?"
      - "Does restraint support clarity rather than obscure it?"
    failure_signals:
      - "Feels premium, fashionable, playful, or emotional"
      - "Too many visual weights competing"
      - "Whitespace has been reduced out of fear"
      - "Typography is trying to perform personality"

  implementation_note:
    summary_for_team: "Build with discipline. The beauty comes from restraint, geometry, and procedural calm."
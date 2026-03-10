---
name: agile-requirement-ecosystem
description: Flujo integral de gestión de requerimientos con alineación estética basada en recursos de diseño locales y lógica de alta ejecución.
steps:
  - name: sync_visual_identity
    use_skill: visual-style-extractor
    params:
      source_dir: "./design"
      extract: ["color_palette", "typography", "component_styles"]
    description: "Analiza las imágenes y assets en la carpeta /design para establecer el sistema de diseño que regirá la UI."

  - name: secure_identity_provisioning
    use_skill: rbac-security-manager
    params:
      action: "enforce_role_policy"
      roles_available: ["Admin", "PM", "Dev"]
      context: "session_init"

  - name: render_intelligent_intake
    use_skill: smart-form-generator
    params:
      form_type: "requirement_entry"
      apply_style: "visual-style-extractor.output"
      dynamic_validation: true
    description: "Genera el formulario de entrada aplicando el estilo visual extraído de la carpeta /design."

  - name: architect_data_persistence
    use_skill: requirements-data-architect
    params:
      operation: "map_to_firestore"
      validation_level: "strict"

  - name: manage_kanban_lifecycle
    use_skill: kanban-flow-controller
    params:
      initial_state: "backlog"
      realtime_sync: true

  - name: calculate_agile_intelligence
    use_skill: agile-metrics-engine
    params:
      metrics: ["cycle_time", "lead_time", "health_score"]

  - name: render_high_execution_dashboard
    use_skill: dashboard-ui-renderer
    params:
      layout: "executive_grid"
      style_reference: "visual-style-extractor.output"
      data_source: "agile-metrics-engine"
    description: "Construye el dashboard de métricas asegurando consistencia visual con los assets de /design."

  - name: execute_deployment_hook
    use_skill: deployment-lifecycle-hook
    params:
      target_env: "production"
      audit_log: true
---
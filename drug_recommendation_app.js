    const STORAGE_KEY = "ada-2026-simplified-therapy-app-v1";

    const DRUG_DATA = await loadDrugData().catch((error) => {
      showInitializationError(error);
      throw error;
    });

    const CLASS_META = {
      metformin: {
        label: "Metformin",
        description: "Foundational low-cost oral option when glycemia is above target and the profile allows it."
      },
      SGLT2i: {
        label: "SGLT2 inhibitor",
        description: "Oral class with strong cardiorenal value and modest weight loss."
      },
      GLP1_RA: {
        label: "GLP-1 RA",
        description: "Injectable class often favored for ASCVD and weight support."
      },
      dual_GIP_GLP1_RA: {
        label: "Dual GIP/GLP-1 RA",
        description: "High-potency injectable option for larger A1C and weight reduction."
      },
      DPP4i: {
        label: "DPP-4 inhibitor",
        description: "Oral, weight-neutral, lower-potency fallback in this simplified model."
      },
      pioglitazone: {
        label: "Pioglitazone",
        description: "Lower-cost oral alternative that may surface when cost matters or MASLD logic fires."
      },
      basal_insulin: {
        label: "Basal insulin",
        description: "Fast potency for severe hyperglycemia, but carries higher hypoglycemia and weight burden."
      }
    };

    const FORM_SECTIONS = [
      {
        title: "Scope and Glycemia",
        description: "Start with diabetes type, A1C, and whether the presentation looks severe.",
        open: true,
        fields: [
          {
            id: "diabetes_type",
            type: "select",
            label: "Diabetes type",
            help: "The algorithm only supports type 2 diabetes.",
            options: [
              { value: "T2DM", label: "Type 2 diabetes" },
              { value: "T1DM", label: "Type 1 diabetes" },
              { value: "NA", label: "Not entered" }
            ]
          },
          {
            id: "a1c_current_percent",
            type: "number",
            label: "Current A1C (%)",
            help: "Used for A1C gap and severe hyperglycemia checks.",
            min: 4,
            max: 18,
            step: 0.1
          },
          {
            id: "a1c_target_percent",
            type: "number",
            label: "Target A1C (%)",
            help: "The simplified tool compares current A1C against this target.",
            min: 5,
            max: 10,
            step: 0.1
          },
          {
            id: "random_glucose_mg_dl",
            type: "number",
            label: "Random glucose (mg/dL)",
            help: "Severe hyperglycemia branch fires at 300 mg/dL or higher.",
            min: 40,
            max: 700,
            step: 1
          },
          {
            id: "symptomatic_hyperglycemia",
            type: "checkbox",
            label: "Symptomatic hyperglycemia",
            help: "Triggers the severe hyperglycemia branch."
          },
          {
            id: "catabolic_features_present",
            type: "checkbox",
            label: "Catabolic features present",
            help: "For example weight loss, ketosis concerns, or marked clinical decompensation."
          }
        ]
      },
      {
        title: "Cardiorenal Drivers",
        description: "These inputs steer ASCVD, heart failure, and CKD priority branches.",
        open: true,
        fields: [
          {
            id: "has_established_ASCVD",
            type: "checkbox",
            label: "Established ASCVD"
          },
          {
            id: "has_indicators_high_CVD_risk",
            type: "checkbox",
            label: "Indicators of high cardiovascular risk"
          },
          {
            id: "has_HF",
            type: "checkbox",
            label: "Heart failure present"
          },
          {
            id: "HF_type",
            type: "select",
            label: "Heart failure type",
            help: "Only used when HF is present.",
            options: [
              { value: "NA", label: "Not specified" },
              { value: "HFpEF", label: "HFpEF" },
              { value: "HFrEF", label: "HFrEF" },
              { value: "other", label: "Other / mixed" }
            ]
          },
          {
            id: "HF_symptomatic",
            type: "checkbox",
            label: "Symptomatic heart failure",
            help: "Needed for the symptomatic HFpEF plus obesity branch."
          },
          {
            id: "egfr_ml_min_1_73m2",
            type: "number",
            label: "eGFR (mL/min/1.73 m²)",
            help: "CKD is flagged below 60; advanced CKD below 30.",
            min: 1,
            max: 180,
            step: 1
          },
          {
            id: "albuminuria_present",
            type: "checkbox",
            label: "Albuminuria present",
            fullWidth: true
          }
        ]
      },
      {
        title: "Weight and Liver",
        description: "Weight-loss goals and liver disease branches can elevate incretin-based therapy.",
        open: false,
        fields: [
          {
            id: "has_obesity",
            type: "checkbox",
            label: "Obesity present"
          },
          {
            id: "weight_loss_goal_priority",
            type: "checkbox",
            label: "Weight loss is an explicit goal"
          },
          {
            id: "prioritize_weight_loss",
            type: "checkbox",
            label: "Prioritize weight loss",
            help: "Mirrors the pseudocode's weight-priority flag."
          },
          {
            id: "has_MASLD",
            type: "checkbox",
            label: "MASLD present"
          },
          {
            id: "has_MASH",
            type: "checkbox",
            label: "MASH present"
          },
          {
            id: "high_risk_liver_fibrosis",
            type: "checkbox",
            label: "High liver fibrosis risk"
          }
        ]
      },
      {
        title: "Safety and Preferences",
        description: "Hypoglycemia risk, oral-only preference, and cost barriers change the rank order.",
        open: false,
        fields: [
          {
            id: "high_hypoglycemia_risk",
            type: "checkbox",
            label: "High hypoglycemia risk"
          },
          {
            id: "prioritize_hypoglycemia_avoidance",
            type: "checkbox",
            label: "Prioritize hypoglycemia avoidance"
          },
          {
            id: "cost_barrier_present",
            type: "checkbox",
            label: "Cost barrier present"
          },
          {
            id: "prefers_oral_only",
            type: "checkbox",
            label: "Prefers oral-only therapy",
            help: "Pushes injectable classes down unless severe hyperglycemia is present."
          },
          {
            id: "willing_to_use_injection",
            type: "checkbox",
            label: "Willing to use injectable therapy",
            help: "Needed for GLP-1 based escalation in this simplified version.",
            fullWidth: true
          }
        ]
      },
      {
        title: "Current Therapy",
        description: "Classes already being used are removed from the recommendation lanes during cleanup.",
        open: false,
        fields: [
          {
            id: "on_metformin",
            type: "checkbox",
            label: "Already on metformin"
          },
          {
            id: "on_SGLT2i",
            type: "checkbox",
            label: "Already on an SGLT2 inhibitor"
          },
          {
            id: "on_GLP1_RA",
            type: "checkbox",
            label: "Already on a GLP-1 RA"
          },
          {
            id: "on_dual_GIP_GLP1_RA",
            type: "checkbox",
            label: "Already on dual GIP/GLP-1 therapy"
          },
          {
            id: "on_DPP4i",
            type: "checkbox",
            label: "Already on a DPP-4 inhibitor"
          },
          {
            id: "on_basal_insulin",
            type: "checkbox",
            label: "Already on basal insulin"
          }
        ]
      },
      {
        title: "Contraindications and Hard Stops",
        description: "These are placed into the avoid lane before final cleanup.",
        open: false,
        fields: [
          {
            id: "metformin_contraindicated",
            type: "checkbox",
            label: "Metformin contraindicated"
          },
          {
            id: "SGLT2i_contraindicated",
            type: "checkbox",
            label: "SGLT2 inhibitor contraindicated"
          },
          {
            id: "GLP1_RA_contraindicated",
            type: "checkbox",
            label: "GLP-1 RA contraindicated"
          },
          {
            id: "dual_GIP_GLP1_RA_contraindicated",
            type: "checkbox",
            label: "Dual GIP/GLP-1 RA contraindicated"
          },
          {
            id: "pioglitazone_contraindicated",
            type: "checkbox",
            label: "Pioglitazone contraindicated"
          },
          {
            id: "dpp4i_contraindicated",
            type: "checkbox",
            label: "DPP-4 inhibitor contraindicated"
          },
          {
            id: "basal_insulin_contraindicated",
            type: "checkbox",
            label: "Basal insulin contraindicated",
            fullWidth: true
          }
        ]
      }
    ];

    const DEFAULT_STATE = {
      diabetes_type: "T2DM",
      a1c_current_percent: 8.6,
      a1c_target_percent: 7.0,
      random_glucose_mg_dl: 180,
      symptomatic_hyperglycemia: false,
      catabolic_features_present: false,
      has_established_ASCVD: false,
      has_indicators_high_CVD_risk: false,
      has_HF: false,
      HF_type: "NA",
      HF_symptomatic: false,
      egfr_ml_min_1_73m2: 82,
      albuminuria_present: false,
      has_obesity: true,
      weight_loss_goal_priority: true,
      prioritize_weight_loss: false,
      has_MASLD: false,
      has_MASH: false,
      high_risk_liver_fibrosis: false,
      high_hypoglycemia_risk: false,
      prioritize_hypoglycemia_avoidance: false,
      cost_barrier_present: false,
      prefers_oral_only: false,
      willing_to_use_injection: true,
      on_metformin: false,
      on_SGLT2i: false,
      on_GLP1_RA: false,
      on_dual_GIP_GLP1_RA: false,
      on_DPP4i: false,
      on_basal_insulin: false,
      metformin_contraindicated: false,
      SGLT2i_contraindicated: false,
      GLP1_RA_contraindicated: false,
      dual_GIP_GLP1_RA_contraindicated: false,
      pioglitazone_contraindicated: false,
      dpp4i_contraindicated: false,
      basal_insulin_contraindicated: false
    };

    const DEMO_STATE = {
      diabetes_type: "T2DM",
      a1c_current_percent: 10.8,
      a1c_target_percent: 7.0,
      random_glucose_mg_dl: 325,
      symptomatic_hyperglycemia: true,
      catabolic_features_present: false,
      has_established_ASCVD: true,
      has_indicators_high_CVD_risk: false,
      has_HF: true,
      HF_type: "HFpEF",
      HF_symptomatic: true,
      egfr_ml_min_1_73m2: 41,
      albuminuria_present: true,
      has_obesity: true,
      weight_loss_goal_priority: true,
      prioritize_weight_loss: true,
      has_MASLD: true,
      has_MASH: false,
      high_risk_liver_fibrosis: false,
      high_hypoglycemia_risk: true,
      prioritize_hypoglycemia_avoidance: true,
      cost_barrier_present: false,
      prefers_oral_only: false,
      willing_to_use_injection: true,
      on_metformin: true,
      on_SGLT2i: false,
      on_GLP1_RA: false,
      on_dual_GIP_GLP1_RA: false,
      on_DPP4i: false,
      on_basal_insulin: false,
      metformin_contraindicated: false,
      SGLT2i_contraindicated: false,
      GLP1_RA_contraindicated: false,
      dual_GIP_GLP1_RA_contraindicated: false,
      pioglitazone_contraindicated: false,
      dpp4i_contraindicated: false,
      basal_insulin_contraindicated: false
    };

    const WIZARD_STAGES = [
      { key: "scope", label: "Scope" },
      { key: "glycemia", label: "Glycemia" },
      { key: "cardiorenal", label: "Cardiorenal" },
      { key: "weight_liver", label: "Weight and Liver" },
      { key: "preferences", label: "Safety and Preferences" },
      { key: "current_therapy", label: "Current Therapy" },
      { key: "exclusions", label: "Exclusions" }
    ];

    const yesNoOptions = [
      { label: "Yes", value: true },
      { label: "No", value: false }
    ];

    const QUESTION_FLOW = [
      {
        id: "diabetes_type",
        stageKey: "scope",
        inputType: "choice",
        label: "What type of diabetes is being evaluated?",
        help: "This simplified algorithm only continues for type 2 diabetes.",
        options: [
          { label: "Type 2 diabetes", value: "T2DM" },
          { label: "Type 1 diabetes", value: "T1DM" },
          { label: "Not entered yet", value: "NA" }
        ],
        apply(state, value) {
          state.diabetes_type = value;
        }
      },
      {
        id: "a1c_current_percent",
        stageKey: "glycemia",
        inputType: "number",
        label: "What is the current A1C?",
        help: "Used for the A1C gap and severe hyperglycemia checks.",
        min: 4,
        max: 18,
        step: 0.1,
        suffix: "%",
        visibleIf: isType2Case
      },
      {
        id: "a1c_target_percent",
        stageKey: "glycemia",
        inputType: "number",
        label: "What is the A1C target for this patient?",
        help: "The tool compares current A1C against this target.",
        min: 5,
        max: 10,
        step: 0.1,
        suffix: "%",
        visibleIf: isType2Case
      },
      {
        id: "random_glucose_mg_dl",
        stageKey: "glycemia",
        inputType: "number",
        label: "What is the random glucose?",
        help: "A value of 300 mg/dL or higher contributes to the urgent branch.",
        min: 40,
        max: 700,
        step: 1,
        suffix: "mg/dL",
        visibleIf: isType2Case
      },
      {
        id: "symptomatic_hyperglycemia",
        stageKey: "glycemia",
        inputType: "choice",
        label: "Is symptomatic hyperglycemia present?",
        help: "Examples include symptomatic high sugars or decompensated presentation.",
        options: yesNoOptions,
        field: "symptomatic_hyperglycemia",
        visibleIf: isType2Case
      },
      {
        id: "catabolic_features_present",
        stageKey: "glycemia",
        inputType: "choice",
        label: "Are catabolic features present?",
        help: "For example weight loss, ketosis concern, or marked clinical decompensation.",
        options: yesNoOptions,
        field: "catabolic_features_present",
        visibleIf: isType2Case
      },
      {
        id: "has_established_ASCVD",
        stageKey: "cardiorenal",
        inputType: "choice",
        label: "Is there established ASCVD?",
        options: yesNoOptions,
        field: "has_established_ASCVD",
        visibleIf: isType2Case
      },
      {
        id: "has_indicators_high_CVD_risk",
        stageKey: "cardiorenal",
        inputType: "choice",
        label: "Are there indicators of high cardiovascular risk?",
        options: yesNoOptions,
        field: "has_indicators_high_CVD_risk",
        visibleIf: isType2Case
      },
      {
        id: "has_HF",
        stageKey: "cardiorenal",
        inputType: "choice",
        label: "Is heart failure present?",
        options: yesNoOptions,
        field: "has_HF",
        visibleIf: isType2Case
      },
      {
        id: "HF_type",
        stageKey: "cardiorenal",
        inputType: "choice",
        label: "What type of heart failure is present?",
        help: "This mainly matters for the symptomatic HFpEF with obesity branch.",
        options: [
          { label: "HFpEF", value: "HFpEF" },
          { label: "HFrEF", value: "HFrEF" },
          { label: "Other or mixed", value: "other" },
          { label: "Not specified", value: "NA" }
        ],
        field: "HF_type",
        visibleIf(state) {
          return isType2Case(state) && state.has_HF;
        }
      },
      {
        id: "HF_symptomatic",
        stageKey: "cardiorenal",
        inputType: "choice",
        label: "Is the heart failure symptomatic?",
        options: yesNoOptions,
        field: "HF_symptomatic",
        visibleIf(state) {
          return isType2Case(state) && state.has_HF;
        }
      },
      {
        id: "egfr_ml_min_1_73m2",
        stageKey: "cardiorenal",
        inputType: "number",
        label: "What is the current eGFR?",
        help: "CKD is flagged below 60; advanced CKD below 30.",
        min: 1,
        max: 180,
        step: 1,
        suffix: "mL/min/1.73 m²",
        visibleIf: isType2Case
      },
      {
        id: "albuminuria_present",
        stageKey: "cardiorenal",
        inputType: "choice",
        label: "Is albuminuria present?",
        options: yesNoOptions,
        field: "albuminuria_present",
        visibleIf: isType2Case
      },
      {
        id: "weight_liver_flags",
        stageKey: "weight_liver",
        inputType: "multi",
        label: "Which weight or liver factors apply?",
        help: "Select every option that fits this patient, then continue.",
        options: [
          { key: "has_obesity", label: "Obesity present" },
          { key: "weight_loss_goal_priority", label: "Weight loss is an explicit goal" },
          { key: "prioritize_weight_loss", label: "Prioritize weight loss" },
          { key: "has_MASLD", label: "MASLD present" },
          { key: "has_MASH", label: "MASH present" },
          { key: "high_risk_liver_fibrosis", label: "High liver fibrosis risk" }
        ],
        visibleIf: isType2Case
      },
      {
        id: "modifier_flags",
        stageKey: "preferences",
        inputType: "multi",
        label: "Which safety and cost modifiers apply?",
        help: "Select all that apply. Route preference is asked next on its own branch.",
        options: [
          { key: "high_hypoglycemia_risk", label: "High hypoglycemia risk" },
          { key: "prioritize_hypoglycemia_avoidance", label: "Prioritize hypoglycemia avoidance" },
          { key: "cost_barrier_present", label: "Cost barrier present" }
        ],
        visibleIf: isType2Case
      },
      {
        id: "route_preference",
        stageKey: "preferences",
        inputType: "choice",
        label: "What route preference should steer the recommendation?",
        help: "Oral-only preference pushes injectable options down unless severe hyperglycemia is present.",
        options: [
          { label: "Open to injectable therapy", value: "injectable" },
          { label: "Oral only", value: "oral_only" },
          { label: "No strong route preference", value: "neutral" }
        ],
        apply(state, value) {
          state.prefers_oral_only = value === "oral_only";
          state.willing_to_use_injection = value === "injectable";
        },
        visibleIf: isType2Case
      },
      {
        id: "current_therapy_flags",
        stageKey: "current_therapy",
        inputType: "multi",
        label: "Which glucose-lowering classes is the patient already using?",
        help: "Already-used classes are removed from the final recommendation lanes.",
        options: [
          { key: "on_metformin", label: "Metformin" },
          { key: "on_SGLT2i", label: "SGLT2 inhibitor" },
          { key: "on_GLP1_RA", label: "GLP-1 RA" },
          { key: "on_dual_GIP_GLP1_RA", label: "Dual GIP/GLP-1 RA" },
          { key: "on_DPP4i", label: "DPP-4 inhibitor" },
          { key: "on_basal_insulin", label: "Basal insulin" }
        ],
        visibleIf: isType2Case
      },
      {
        id: "contraindication_flags",
        stageKey: "exclusions",
        inputType: "multi",
        label: "Which classes are contraindicated or hard stops?",
        help: "These are moved into the avoid lane before final cleanup.",
        options: [
          { key: "metformin_contraindicated", label: "Metformin" },
          { key: "SGLT2i_contraindicated", label: "SGLT2 inhibitor" },
          { key: "GLP1_RA_contraindicated", label: "GLP-1 RA" },
          { key: "dual_GIP_GLP1_RA_contraindicated", label: "Dual GIP/GLP-1 RA" },
          { key: "pioglitazone_contraindicated", label: "Pioglitazone" },
          { key: "dpp4i_contraindicated", label: "DPP-4 inhibitor" },
          { key: "basal_insulin_contraindicated", label: "Basal insulin" }
        ],
        visibleIf: isType2Case
      }
    ];

    const dom = {
      demoBtn: document.getElementById("demo-btn"),
      openResultsBtn: document.getElementById("open-results-btn"),
      jumpToResultsTopBtn: document.getElementById("jump-to-results-top"),
      backToQuestionsBtn: document.getElementById("back-to-questions-btn"),
      resetBtn: document.getElementById("reset-btn"),
      tabButtons: Array.from(document.querySelectorAll(".tab-btn")),
      tabPanels: Array.from(document.querySelectorAll(".tab-panel")),
      wizardStageLabel: document.getElementById("wizard-stage-label"),
      wizardProgressCopy: document.getElementById("wizard-progress-copy"),
      wizardProgressFill: document.getElementById("wizard-progress-fill"),
      wizardStepCount: document.getElementById("wizard-step-count"),
      wizardPathCount: document.getElementById("wizard-path-count"),
      flowchartViewport: document.getElementById("flowchart-viewport"),
      flowchartCanvas: document.getElementById("flowchart-canvas"),
      questionScrollShell: document.getElementById("question-scroll-shell"),
      questionHistoryList: document.getElementById("question-history-list"),
      questionCard: document.getElementById("question-card"),
      questionStage: document.getElementById("question-stage"),
      questionTitle: document.getElementById("question-title"),
      questionHelp: document.getElementById("question-help"),
      questionInputArea: document.getElementById("question-input-area"),
      backQuestionBtn: document.getElementById("back-question-btn"),
      reviewResultsBtn: document.getElementById("review-results-btn"),
      advanceQuestionBtn: document.getElementById("advance-question-btn"),
      statusBanner: document.getElementById("status-banner"),
      preferredGrid: document.getElementById("preferred-grid"),
      acceptableGrid: document.getElementById("acceptable-grid"),
      avoidGrid: document.getElementById("avoid-grid"),
      preferredCount: document.getElementById("preferred-count"),
      acceptableCount: document.getElementById("acceptable-count"),
      avoidCount: document.getElementById("avoid-count"),
      rationaleRow: document.getElementById("rationale-row"),
      flagRow: document.getElementById("flag-row"),
      compareLeft: document.getElementById("compare-left"),
      compareRight: document.getElementById("compare-right"),
      compareLeftCard: document.getElementById("compare-left-card"),
      compareRightCard: document.getElementById("compare-right-card")
    };

    const groupedDrugs = groupDrugsByClass(DRUG_DATA.drugs);
    const QUESTION_LOOKUP = Object.fromEntries(QUESTION_FLOW.map((question) => [question.id, question]));
    let compareState = { left: "", right: "" };
    let latestState = { ...DEFAULT_STATE };
    let latestResult = null;
    let wizardSession = {
      answeredQuestionIds: [],
      questionHistory: [],
      currentQuestionId: null
    };

    bindStaticEvents();
    hydrateSession(loadStoredState());

    function bindStaticEvents() {
      dom.demoBtn.addEventListener("click", () => hydrateSession(createCompletedSession(DEMO_STATE)));
      dom.resetBtn.addEventListener("click", () => hydrateSession(createFreshSession(DEFAULT_STATE)));
      dom.openResultsBtn.addEventListener("click", () => switchTab("tab-results"));
      dom.jumpToResultsTopBtn.addEventListener("click", () => switchTab("tab-results"));
      dom.backToQuestionsBtn.addEventListener("click", () => switchTab("tab-intake"));
      dom.reviewResultsBtn.addEventListener("click", () => switchTab("tab-results"));
      dom.backQuestionBtn.addEventListener("click", goToPreviousQuestion);
      dom.advanceQuestionBtn.addEventListener("click", advanceCurrentQuestion);

      dom.tabButtons.forEach((button) => {
        button.addEventListener("click", () => switchTab(button.dataset.tabTarget));
      });

      dom.questionInputArea.addEventListener("click", (event) => {
        const choiceButton = event.target.closest("[data-option-index]");
        if (!choiceButton) {
          return;
        }

        const currentQuestion = getCurrentQuestion(latestState);
        if (!currentQuestion || currentQuestion.inputType !== "choice") {
          return;
        }

        const optionIndex = Number(choiceButton.dataset.optionIndex);
        if (!Number.isInteger(optionIndex)) {
          return;
        }

        const option = currentQuestion.options[optionIndex];
        if (!option) {
          return;
        }

        const nextState = { ...latestState };
        applyQuestionAnswer(currentQuestion, nextState, option.value);
        commitQuestionAnswer(currentQuestion, nextState);
      });

      dom.questionInputArea.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") {
          return;
        }

        const currentQuestion = getCurrentQuestion(latestState);
        if (!currentQuestion || currentQuestion.inputType === "choice") {
          return;
        }

        event.preventDefault();
        advanceCurrentQuestion();
      });

      dom.compareLeft.addEventListener("change", () => {
        compareState.left = dom.compareLeft.value;
        if (latestResult) {
          renderCompareCards(latestResult, latestState);
        }
      });

      dom.compareRight.addEventListener("change", () => {
        compareState.right = dom.compareRight.value;
        if (latestResult) {
          renderCompareCards(latestResult, latestState);
        }
      });
    }

    function hydrateSession(savedSession) {
      const legacyState = savedSession && !savedSession.state ? savedSession : null;
      latestState = normalizeState({
        ...DEFAULT_STATE,
        ...(savedSession?.state || legacyState || DEFAULT_STATE)
      });

      wizardSession = {
        answeredQuestionIds: Array.isArray(savedSession?.answeredQuestionIds) ? [...savedSession.answeredQuestionIds] : [],
        questionHistory: Array.isArray(savedSession?.questionHistory) ? [...savedSession.questionHistory] : [],
        currentQuestionId: savedSession?.currentQuestionId || null
      };

      pruneWizardSession(latestState);

      if (!wizardSession.currentQuestionId && wizardSession.answeredQuestionIds.length === 0) {
        wizardSession.currentQuestionId = getNextQuestionId(latestState);
      }

      if (legacyState) {
        wizardSession.currentQuestionId = getNextQuestionId(latestState);
      }

      persistState();
      renderApplication(latestState);
    }

    function createFreshSession(state) {
      return {
        state: normalizeState({ ...DEFAULT_STATE, ...state }),
        answeredQuestionIds: [],
        questionHistory: [],
        currentQuestionId: getFirstVisibleQuestionId(normalizeState({ ...DEFAULT_STATE, ...state }))
      };
    }

    function createCompletedSession(state) {
      const normalized = normalizeState({ ...DEFAULT_STATE, ...state });
      const visibleIds = getVisibleQuestions(normalized).map((question) => question.id);
      return {
        state: normalized,
        answeredQuestionIds: visibleIds,
        questionHistory: visibleIds,
        currentQuestionId: null
      };
    }

    function normalizeState(state) {
      const nextState = { ...DEFAULT_STATE, ...state };

      if (!nextState.has_HF) {
        nextState.HF_type = "NA";
        nextState.HF_symptomatic = false;
      }

      if (nextState.prefers_oral_only) {
        nextState.willing_to_use_injection = false;
      }

      if (nextState.has_MASH) {
        nextState.has_MASLD = true;
      }

      return nextState;
    }

    function pruneWizardSession(state) {
      const visibleIds = getVisibleQuestions(state).map((question) => question.id);
      wizardSession.answeredQuestionIds = dedupe(wizardSession.answeredQuestionIds.filter((id) => visibleIds.includes(id)));
      wizardSession.questionHistory = dedupe(wizardSession.questionHistory.filter((id) => visibleIds.includes(id)));

      if (wizardSession.currentQuestionId && !visibleIds.includes(wizardSession.currentQuestionId)) {
        wizardSession.currentQuestionId = null;
      }

      const currentQuestion = wizardSession.currentQuestionId ? QUESTION_LOOKUP[wizardSession.currentQuestionId] : null;
      if (!currentQuestion && !wizardSession.currentQuestionId) {
        wizardSession.currentQuestionId = getNextQuestionId(state);
      }
    }

    function isType2Case(state) {
      return state.diabetes_type === "T2DM";
    }

    function getVisibleQuestions(state) {
      return QUESTION_FLOW.filter((question) => {
        if (typeof question.visibleIf === "function") {
          return question.visibleIf(state);
        }
        return true;
      });
    }

    function getFirstVisibleQuestionId(state) {
      return getVisibleQuestions(state)[0]?.id || null;
    }

    function getCurrentQuestion(state) {
      const visibleQuestions = getVisibleQuestions(state);
      if (!visibleQuestions.length) {
        return null;
      }

      if (wizardSession.currentQuestionId) {
        const explicitQuestion = visibleQuestions.find((question) => question.id === wizardSession.currentQuestionId);
        if (explicitQuestion) {
          return explicitQuestion;
        }
      }

      const nextQuestion = visibleQuestions.find((question) => !wizardSession.answeredQuestionIds.includes(question.id)) || null;
      wizardSession.currentQuestionId = nextQuestion ? nextQuestion.id : null;
      return nextQuestion;
    }

    function getNextQuestionId(state, fromQuestionId = null) {
      const visibleQuestions = getVisibleQuestions(state);
      if (!visibleQuestions.length) {
        return null;
      }

      const answered = new Set(wizardSession.answeredQuestionIds);
      if (fromQuestionId) {
        const currentIndex = visibleQuestions.findIndex((question) => question.id === fromQuestionId);
        for (let index = currentIndex + 1; index < visibleQuestions.length; index += 1) {
          if (!answered.has(visibleQuestions[index].id)) {
            return visibleQuestions[index].id;
          }
        }
      }

      return visibleQuestions.find((question) => !answered.has(question.id))?.id || null;
    }

    function getPreviousQuestionId(state) {
      const visibleQuestions = getVisibleQuestions(state);
      if (!visibleQuestions.length) {
        return null;
      }

      if (!wizardSession.currentQuestionId) {
        return visibleQuestions[visibleQuestions.length - 1]?.id || null;
      }

      const currentIndex = visibleQuestions.findIndex((question) => question.id === wizardSession.currentQuestionId);
      return currentIndex > 0 ? visibleQuestions[currentIndex - 1].id : null;
    }

    function goToPreviousQuestion() {
      const previousId = getPreviousQuestionId(latestState);
      if (!previousId) {
        return;
      }

      wizardSession.currentQuestionId = previousId;
      persistState();
      renderApplication(latestState);
    }

    function advanceCurrentQuestion() {
      const currentQuestion = getCurrentQuestion(latestState);
      if (!currentQuestion) {
        switchTab("tab-results");
        return;
      }

      const nextState = { ...latestState };

      if (currentQuestion.inputType === "number") {
        const input = dom.questionInputArea.querySelector("#wizard-number-input");
        const rawValue = input ? input.value : latestState[currentQuestion.id];
        applyQuestionAnswer(currentQuestion, nextState, rawValue);
      } else if (currentQuestion.inputType === "multi") {
        const selectedMap = {};
        currentQuestion.options.forEach((option) => {
          const checkbox = dom.questionInputArea.querySelector(`[data-multi-key="${option.key}"]`);
          selectedMap[option.key] = Boolean(checkbox?.checked);
        });
        applyQuestionAnswer(currentQuestion, nextState, selectedMap);
      }

      commitQuestionAnswer(currentQuestion, nextState);
    }

    function applyQuestionAnswer(question, state, value) {
      if (typeof question.apply === "function") {
        question.apply(state, value);
        return;
      }

      if (question.inputType === "multi") {
        question.options.forEach((option) => {
          state[option.key] = Boolean(value[option.key]);
        });
        return;
      }

      if (question.inputType === "number") {
        state[question.id] = toNumber(value, DEFAULT_STATE[question.id] ?? 0);
        return;
      }

      if (question.field) {
        state[question.field] = value;
        return;
      }

      state[question.id] = value;
    }

    function commitQuestionAnswer(question, nextState) {
      latestState = normalizeState(nextState);
      addUnique(wizardSession.answeredQuestionIds, question.id);
      addUnique(wizardSession.questionHistory, question.id);
      pruneWizardSession(latestState);
      wizardSession.currentQuestionId = getNextQuestionId(latestState, question.id);
      persistState();
      renderApplication(latestState);
    }

    function getQuestionCurrentValue(question, state) {
      if (question.id === "route_preference") {
        if (state.prefers_oral_only) {
          return "oral_only";
        }
        if (state.willing_to_use_injection) {
          return "injectable";
        }
        return "neutral";
      }

      if (question.inputType === "multi") {
        return question.options.reduce((accumulator, option) => {
          accumulator[option.key] = Boolean(state[option.key]);
          return accumulator;
        }, {});
      }

      if (question.field) {
        return state[question.field];
      }

      return state[question.id];
    }

    function getQuestionAnswerSummary(question, state) {
      const currentValue = getQuestionCurrentValue(question, state);

      if (question.inputType === "choice") {
        return question.options.find((option) => option.value === currentValue)?.label || "Not answered";
      }

      if (question.inputType === "number") {
        return `${currentValue} ${question.suffix || ""}`.trim();
      }

      if (question.inputType === "multi") {
        const selected = question.options
          .filter((option) => currentValue[option.key])
          .map((option) => option.label);
        return selected.length ? selected.join(", ") : "None selected";
      }

      return "Not answered";
    }

    function renderApplication(state) {
      const currentQuestion = getCurrentQuestion(state);
      const result = recommendTherapy(state);
      latestState = { ...state };
      latestResult = result;
      renderFlowchart(state, result, currentQuestion);
      renderWizard(state, result, currentQuestion);
      updateCounts(result);
      renderStatus(result);
      renderLane("preferred", result.preferred_classes, dom.preferredGrid, state);
      renderLane("acceptable", result.acceptable_classes, dom.acceptableGrid, state);
      renderLane("avoid", result.avoid_classes, dom.avoidGrid, state);
      renderRationale(result);
      renderFlags(result);
      buildCompareSelectors(result, state);
      renderCompareCards(result, state);
      queueCenteredActiveStep();
    }

    function renderWizard(state, result, currentQuestion) {
      const visibleQuestions = getVisibleQuestions(state);
      const answeredVisibleIds = visibleQuestions
        .map((question) => question.id)
        .filter((id) => wizardSession.answeredQuestionIds.includes(id));
      const totalQuestions = visibleQuestions.length;
      const answeredCount = answeredVisibleIds.length;
      const currentQuestionIndex = currentQuestion
        ? visibleQuestions.findIndex((question) => question.id === currentQuestion.id) + 1
        : Math.max(totalQuestions, 1);
      const progressPercent = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 100;

      dom.wizardProgressFill.style.width = `${progressPercent}%`;
      dom.wizardStepCount.textContent = `${answeredCount} of ${totalQuestions} answered`;
      dom.wizardPathCount.textContent = `${wizardSession.questionHistory.length} decision points mapped`;

      if (currentQuestion) {
        dom.wizardStageLabel.textContent = `${getStageLabel(currentQuestion.stageKey)} branch`;
        dom.wizardProgressCopy.textContent = `Question ${currentQuestionIndex} of ${totalQuestions}.`;
      } else if (result.status === "ok") {
        dom.wizardStageLabel.textContent = "Decision tree complete";
        dom.wizardProgressCopy.textContent = "The intake path has enough information for a full recommendation board.";
      } else {
        dom.wizardStageLabel.textContent = "Decision tree paused";
        dom.wizardProgressCopy.textContent = result.message;
      }

      renderQuestionHistory(state, currentQuestion);
      renderCurrentQuestion(state, result, currentQuestion, currentQuestionIndex, totalQuestions, answeredCount);
    }

    function renderQuestionHistory(state, currentQuestion) {
      const pathIds = getDisplayedPathIds(state, currentQuestion);

      if (!pathIds.length) {
        dom.questionHistoryList.innerHTML = "";
        return;
      }

      dom.questionHistoryList.innerHTML = pathIds.map((id, index) => {
        const question = QUESTION_LOOKUP[id];
        const answerSummary = getQuestionAnswerSummary(question, state);
        return `
          <article class="question-history-card ${index === pathIds.length - 1 ? "is-latest" : ""}">
            <div class="question-history-topline">
              <span class="path-index">${index + 1}</span>
              <span class="question-history-stage">${getStageLabel(question.stageKey)}</span>
            </div>
            <div>
              <strong>${question.label}</strong>
              <div class="history-answer-badge">${answerSummary}</div>
            </div>
          </article>
        `;
      }).join("");
    }

    function renderCurrentQuestion(state, result, question, questionIndex, totalQuestions, answeredCount) {
      if (!question) {
        dom.questionCard.classList.add("is-complete");
        dom.questionCard.classList.remove("is-current");
        dom.questionStage.textContent = result.status === "ok" ? "Ready to review" : "Needs scope correction";
        dom.questionTitle.textContent = result.status === "ok"
          ? "The guided intake is complete."
          : result.message;
        dom.questionHelp.textContent = result.status === "ok"
          ? "You can open the recommendation tab now, or go back to revise earlier answers."
          : "Use Back to revise the scope answer if you want to continue the type 2 diabetes pathway.";
        dom.questionInputArea.innerHTML = renderCompletionPreview(result);
        dom.advanceQuestionBtn.hidden = true;
        dom.reviewResultsBtn.textContent = "Open recommendation tab";
        dom.backQuestionBtn.disabled = !getPreviousQuestionId(state);
        return;
      }

      dom.questionCard.classList.remove("is-complete");
      dom.questionCard.classList.add("is-current");
      dom.questionStage.textContent = `${getStageLabel(question.stageKey)} • Question ${questionIndex} of ${totalQuestions}`;
      dom.questionTitle.textContent = question.label;
      dom.questionHelp.textContent = question.help || "Answer this branch point to continue.";
      dom.questionInputArea.innerHTML = renderQuestionInput(question, state);
      dom.advanceQuestionBtn.hidden = question.inputType === "choice";
      dom.advanceQuestionBtn.textContent = "Continue";
      dom.reviewResultsBtn.textContent = answeredCount ? "Review recommendations" : "Skip to recommendations";
      dom.backQuestionBtn.disabled = !getPreviousQuestionId(state);
    }

    function renderQuestionInput(question, state) {
      if (question.inputType === "choice") {
        const currentValue = getQuestionCurrentValue(question, state);
        return `
          <div class="choice-grid">
            ${question.options.map((option, index) => `
              <button
                class="answer-choice-btn ${option.value === currentValue ? "is-selected" : ""}"
                type="button"
                data-option-index="${index}">
                ${option.label}
              </button>
            `).join("")}
          </div>
        `;
      }

      if (question.inputType === "number") {
        const currentValue = getQuestionCurrentValue(question, state);
        return `
          <div class="number-question-shell">
            <label class="question-field-label" for="wizard-number-input">Enter value</label>
            <div class="number-input-wrap">
              <input
                id="wizard-number-input"
                type="number"
                min="${question.min}"
                max="${question.max}"
                step="${question.step}"
                value="${currentValue}">
              <span>${question.suffix || ""}</span>
            </div>
            <p class="question-caption">Use Continue to move to the next decision point.</p>
          </div>
        `;
      }

      const currentValue = getQuestionCurrentValue(question, state);
      return `
        <div class="multi-option-grid">
          ${question.options.map((option) => `
            <label class="multi-option">
              <input type="checkbox" data-multi-key="${option.key}" ${currentValue[option.key] ? "checked" : ""}>
              <span>${option.label}</span>
            </label>
          `).join("")}
        </div>
        <p class="question-caption">Select all that apply, then continue.</p>
      `;
    }

    function renderCompletionPreview(result) {
      const preferredPreview = result.preferred_classes.length
        ? result.preferred_classes.map((classId) => `<span class="pill preferred">${CLASS_META[classId].label}</span>`).join("")
        : `<span class="pill neutral">No preferred class yet</span>`;

      const acceptablePreview = result.acceptable_classes.length
        ? result.acceptable_classes.map((classId) => `<span class="pill acceptable">${CLASS_META[classId].label}</span>`).join("")
        : `<span class="pill neutral">No acceptable class yet</span>`;

      return `
        <div class="completion-preview">
          <div class="completion-copy">
            <strong>Current lane preview</strong>
            <p>The recommendation tab already reflects everything gathered in the decision tree.</p>
          </div>
          <div class="completion-chip-row">${preferredPreview}</div>
          <div class="completion-chip-row">${acceptablePreview}</div>
        </div>
      `;
    }

    function getStageLabel(stageKey) {
      return WIZARD_STAGES.find((stage) => stage.key === stageKey)?.label || "Decision";
    }

    function getDisplayedPathIds(state, currentQuestion) {
      const visibleIds = getVisibleQuestions(state).map((question) => question.id);
      const currentIndex = currentQuestion ? visibleIds.indexOf(currentQuestion.id) : visibleIds.length;
      return visibleIds.filter((id, index) => {
        return index < currentIndex && wizardSession.questionHistory.includes(id);
      });
    }

    function queueCenteredActiveStep() {
      requestAnimationFrame(() => {
        if (wizardSession.questionHistory.length) {
          centerElementInContainer(dom.questionCard, dom.questionScrollShell);
        } else {
          dom.questionScrollShell.scrollTo({
            top: 0,
            behavior: "smooth"
          });
        }
        const activeFlowNode = document.getElementById("current-flow-node") || document.getElementById("flow-complete-node");
        centerElementInContainer(activeFlowNode, dom.flowchartViewport);
      });
    }

    function centerElementInContainer(element, container) {
      if (!element || !container) {
        return;
      }

      const targetTop = element.offsetTop - (container.clientHeight / 2) + (element.clientHeight / 2);
      container.scrollTo({
        top: Math.max(0, targetTop),
        behavior: "smooth"
      });
    }

    function switchTab(tabId) {
      dom.tabButtons.forEach((button) => {
        const isActive = button.dataset.tabTarget === tabId;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-selected", String(isActive));
        button.tabIndex = isActive ? 0 : -1;
      });

      dom.tabPanels.forEach((panel) => {
        const isActive = panel.id === tabId;
        panel.hidden = !isActive;
        panel.classList.toggle("is-active", isActive);
      });
    }

    function renderFlowchart(state, result, currentQuestion) {
      const pathIds = getDisplayedPathIds(state, currentQuestion);
      const pathMarkup = [];

      if (!pathIds.length) {
        pathMarkup.push(`
          <article class="flow-path-node flow-path-node-start">
            <span class="flow-kicker">Start</span>
            <h3>Simplified ADA intake pathway</h3>
            <p>The flow follows the live decision path created by the user's answers.</p>
          </article>
        `);

        if (currentQuestion) {
          pathMarkup.push(renderFlowConnector("Begin"));
        }
      }

      pathIds.forEach((id, index) => {
        const question = QUESTION_LOOKUP[id];
        const answerSummary = getQuestionAnswerSummary(question, state);
        pathMarkup.push(`
          <article class="flow-path-node is-answered">
            <span class="flow-kicker">${getStageLabel(question.stageKey)}</span>
            <h3>${question.label}</h3>
            <div class="flow-node-answer">${answerSummary}</div>
          </article>
        `);

        const hasNextNode = index < pathIds.length - 1 || Boolean(currentQuestion);
        if (hasNextNode) {
          pathMarkup.push(renderFlowConnector(answerSummary));
        }
      });

      if (currentQuestion) {
        pathMarkup.push(`
          <article class="flow-path-node is-current" id="current-flow-node">
            <span class="flow-kicker">${getStageLabel(currentQuestion.stageKey)}</span>
            <h3>${currentQuestion.label}</h3>
            <p>${currentQuestion.help || "Answer this branch point to continue the pathway."}</p>
          </article>
        `);
      } else {
        const completeTone = result.status === "ok" ? "is-complete" : "is-warning";
        pathMarkup.push(renderFlowConnector(result.status === "ok" ? "Path complete" : "Needs correction"));
        pathMarkup.push(`
          <article class="flow-path-node ${completeTone}" id="flow-complete-node">
            <span class="flow-kicker">${result.status === "ok" ? "Recommendation ready" : "Scope issue"}</span>
            <h3>${result.status === "ok" ? "Decision tree complete" : "Pathway paused"}</h3>
            <p>${result.status === "ok"
              ? `${result.preferred_classes.length} preferred, ${result.acceptable_classes.length} acceptable, ${result.avoid_classes.length} avoid.`
              : result.message}</p>
          </article>
        `);
      }

      dom.flowchartCanvas.innerHTML = pathMarkup.join("");
    }

    function renderFlowConnector(label) {
      return `
        <div class="flow-connector">
          <div class="flow-line"></div>
          <div class="flow-answer-chip">${label}</div>
          <div class="flow-line"></div>
        </div>
      `;
    }

    function recommendTherapy(inputs) {
      if (inputs.diabetes_type === "NA") {
        return {
          status: "error",
          message: "Diabetes type is required before the simplified algorithm can run.",
          preferred_classes: [],
          acceptable_classes: [],
          avoid_classes: [],
          rationale: [],
          derived_flags: {}
        };
      }

      if (inputs.diabetes_type === "T1DM") {
        return {
          status: "redirect",
          message: "Out of scope: this simplified tool is limited to type 2 diabetes.",
          preferred_classes: [],
          acceptable_classes: [],
          avoid_classes: [],
          rationale: [],
          derived_flags: {}
        };
      }

      if (inputs.diabetes_type !== "T2DM") {
        return {
          status: "error",
          message: "Unsupported diabetes type.",
          preferred_classes: [],
          acceptable_classes: [],
          avoid_classes: [],
          rationale: [],
          derived_flags: {}
        };
      }

      const preferred_classes = [];
      const acceptable_classes = [];
      const avoid_classes = [];
      const rationale = [];

      const a1c_gap = roundToOne(inputs.a1c_current_percent - inputs.a1c_target_percent);
      const above_a1c_goal = inputs.a1c_current_percent > inputs.a1c_target_percent;
      const severe_hyperglycemia =
        Boolean(inputs.symptomatic_hyperglycemia) ||
        Boolean(inputs.catabolic_features_present) ||
        inputs.a1c_current_percent > 10.0 ||
        inputs.random_glucose_mg_dl >= 300;

      const has_cardiorenal_driver =
        Boolean(inputs.has_established_ASCVD) ||
        Boolean(inputs.has_indicators_high_CVD_risk) ||
        Boolean(inputs.has_HF) ||
        inputs.egfr_ml_min_1_73m2 < 60 ||
        Boolean(inputs.albuminuria_present);

      const has_CKD = inputs.egfr_ml_min_1_73m2 < 60 || Boolean(inputs.albuminuria_present);
      const advanced_CKD = inputs.egfr_ml_min_1_73m2 < 30;
      const SGLT2_low_glycemic_effect = inputs.egfr_ml_min_1_73m2 < 45;

      if (inputs.metformin_contraindicated) {
        addUnique(avoid_classes, "metformin");
      }

      if (inputs.SGLT2i_contraindicated) {
        addUnique(avoid_classes, "SGLT2i");
      }

      if (inputs.GLP1_RA_contraindicated) {
        addUnique(avoid_classes, "GLP1_RA");
      }

      if (inputs.dual_GIP_GLP1_RA_contraindicated) {
        addUnique(avoid_classes, "dual_GIP_GLP1_RA");
      }

      if (inputs.pioglitazone_contraindicated) {
        addUnique(avoid_classes, "pioglitazone");
      }

      if (inputs.dpp4i_contraindicated) {
        addUnique(avoid_classes, "DPP4i");
      }

      if (inputs.basal_insulin_contraindicated) {
        addUnique(avoid_classes, "basal_insulin");
      }

      if (severe_hyperglycemia) {
        addUnique(preferred_classes, "basal_insulin");
        addUnique(rationale, "urgent glycemic control / severe hyperglycemia");

        if (inputs.willing_to_use_injection) {
          if (!inputs.on_GLP1_RA && !inputs.on_dual_GIP_GLP1_RA) {
            addUnique(acceptable_classes, "GLP1_RA");
          }

          if (!inputs.on_GLP1_RA &&
              !inputs.on_dual_GIP_GLP1_RA &&
              (inputs.prioritize_weight_loss || inputs.has_obesity)) {
            addUnique(acceptable_classes, "dual_GIP_GLP1_RA");
          }
        }
      }

      if (inputs.has_established_ASCVD || inputs.has_indicators_high_CVD_risk) {
        addUnique(rationale, "ASCVD/high CV risk present");

        if (!inputs.on_GLP1_RA) {
          addUnique(preferred_classes, "GLP1_RA");
        }

        if (!inputs.on_SGLT2i) {
          addUnique(preferred_classes, "SGLT2i");
        }
      }

      if (inputs.has_HF) {
        addUnique(rationale, "HF present");

        if (!inputs.on_SGLT2i) {
          addUnique(preferred_classes, "SGLT2i");
        }

        if (inputs.HF_type === "HFpEF" && inputs.HF_symptomatic && inputs.has_obesity) {
          addUnique(rationale, "symptomatic HFpEF with obesity");

          if (!inputs.on_dual_GIP_GLP1_RA) {
            addUnique(acceptable_classes, "dual_GIP_GLP1_RA");
          } else if (!inputs.on_GLP1_RA) {
            addUnique(acceptable_classes, "GLP1_RA");
          }
        }
      }

      if (has_CKD) {
        addUnique(rationale, "CKD present");

        if (advanced_CKD) {
          if (!inputs.on_GLP1_RA) {
            addUnique(preferred_classes, "GLP1_RA");
          }
        } else {
          if (!inputs.on_SGLT2i) {
            addUnique(preferred_classes, "SGLT2i");
          }

          if (!inputs.on_GLP1_RA) {
            addUnique(acceptable_classes, "GLP1_RA");
          }
        }
      }

      if (inputs.has_obesity || inputs.weight_loss_goal_priority || inputs.prioritize_weight_loss) {
        addUnique(rationale, "weight loss priority present");

        if (!inputs.on_dual_GIP_GLP1_RA) {
          addUnique(preferred_classes, "dual_GIP_GLP1_RA");
        } else if (!inputs.on_GLP1_RA) {
          addUnique(preferred_classes, "GLP1_RA");
        } else if (!inputs.on_SGLT2i) {
          addUnique(acceptable_classes, "SGLT2i");
        }
      }

      if (inputs.has_MASH || inputs.high_risk_liver_fibrosis) {
        addUnique(rationale, "MASH / fibrosis risk present");

        if (!inputs.on_GLP1_RA) {
          addUnique(preferred_classes, "GLP1_RA");
        } else if (!inputs.on_dual_GIP_GLP1_RA) {
          addUnique(acceptable_classes, "dual_GIP_GLP1_RA");
        } else {
          addUnique(acceptable_classes, "pioglitazone");
        }
      } else if (inputs.has_MASLD) {
        addUnique(rationale, "MASLD present");

        if (!inputs.on_GLP1_RA) {
          addUnique(acceptable_classes, "GLP1_RA");
        }

        if (!inputs.on_dual_GIP_GLP1_RA) {
          addUnique(acceptable_classes, "dual_GIP_GLP1_RA");
        }

        addUnique(acceptable_classes, "pioglitazone");
      }

      if (above_a1c_goal) {
        addUnique(rationale, "glycemia above target");

        if (!inputs.on_metformin) {
          addUnique(preferred_classes, "metformin");
        }

        if (a1c_gap >= 1.5) {
          addUnique(rationale, "A1C >=1.5% above target");

          if (!inputs.on_dual_GIP_GLP1_RA && inputs.willing_to_use_injection) {
            addUnique(preferred_classes, "dual_GIP_GLP1_RA");
          } else if (!inputs.on_GLP1_RA && inputs.willing_to_use_injection) {
            addUnique(preferred_classes, "GLP1_RA");
          } else if (!inputs.on_SGLT2i) {
            addUnique(acceptable_classes, "SGLT2i");
          }
        }
      }

      if (inputs.high_hypoglycemia_risk || inputs.prioritize_hypoglycemia_avoidance) {
        addUnique(rationale, "hypoglycemia avoidance prioritized");

        moveUpIfPresent("metformin", preferred_classes, acceptable_classes);
        moveUpIfPresent("SGLT2i", preferred_classes, acceptable_classes);
        moveUpIfPresent("GLP1_RA", preferred_classes, acceptable_classes);
        moveUpIfPresent("dual_GIP_GLP1_RA", preferred_classes, acceptable_classes);

        if (!severe_hyperglycemia) {
          moveDownIfPresent("basal_insulin", preferred_classes, acceptable_classes);
        }
      }

      if (inputs.cost_barrier_present) {
        addUnique(rationale, "cost barrier present");

        moveUpIfPresent("metformin", preferred_classes, acceptable_classes);
        addUnique(acceptable_classes, "pioglitazone");

        if (!has_cardiorenal_driver) {
          moveDownIfPresent("GLP1_RA", preferred_classes, acceptable_classes);
          moveDownIfPresent("dual_GIP_GLP1_RA", preferred_classes, acceptable_classes);
          moveDownIfPresent("SGLT2i", preferred_classes, acceptable_classes);
        }
      }

      if (inputs.prefers_oral_only) {
        addUnique(rationale, "oral-only preference");

        moveDownIfPresent("GLP1_RA", preferred_classes, acceptable_classes);
        moveDownIfPresent("dual_GIP_GLP1_RA", preferred_classes, acceptable_classes);

        if (!severe_hyperglycemia) {
          moveDownIfPresent("basal_insulin", preferred_classes, acceptable_classes);
        }

        addUnique(preferred_classes, "metformin");
        addUnique(acceptable_classes, "SGLT2i");
        addUnique(acceptable_classes, "pioglitazone");

        if (!inputs.on_DPP4i && !inputs.on_GLP1_RA && !inputs.on_dual_GIP_GLP1_RA) {
          addUnique(acceptable_classes, "DPP4i");
        }
      }

      if (inputs.on_GLP1_RA || inputs.on_dual_GIP_GLP1_RA) {
        removeIfPresent("DPP4i", preferred_classes);
        removeIfPresent("DPP4i", acceptable_classes);
        addUnique(rationale, "avoid DPP-4i with GLP-1-based therapy");
      }

      if (SGLT2_low_glycemic_effect) {
        addUnique(rationale, "SGLT2 glycemic efficacy reduced at lower eGFR");
      }

      if (advanced_CKD) {
        moveDownIfPresent("metformin", preferred_classes, acceptable_classes);
      }

      const currentClasses = [];
      if (inputs.on_metformin) currentClasses.push("metformin");
      if (inputs.on_SGLT2i) currentClasses.push("SGLT2i");
      if (inputs.on_GLP1_RA) currentClasses.push("GLP1_RA");
      if (inputs.on_dual_GIP_GLP1_RA) currentClasses.push("dual_GIP_GLP1_RA");
      if (inputs.on_DPP4i) currentClasses.push("DPP4i");
      if (inputs.on_basal_insulin) currentClasses.push("basal_insulin");

      currentClasses.forEach((classId) => {
        removeIfPresent(classId, preferred_classes);
        removeIfPresent(classId, acceptable_classes);
      });

      const preferred = dedupe(preferred_classes);
      const acceptable = dedupe(acceptable_classes);
      const avoid = dedupe(avoid_classes);

      avoid.forEach((classId) => {
        removeIfPresent(classId, preferred);
        removeIfPresent(classId, acceptable);
      });

      if (preferred.length === 0 && acceptable.length === 0) {
        if (!inputs.on_metformin) {
          preferred.push("metformin");
        } else if (!inputs.on_SGLT2i) {
          preferred.push("SGLT2i");
        } else if (!inputs.on_GLP1_RA && !inputs.prefers_oral_only) {
          preferred.push("GLP1_RA");
        } else {
          addUnique(rationale, "needs manual clinical review");
        }
      }

      const derived_flags = {
        a1c_gap,
        above_a1c_goal,
        severe_hyperglycemia,
        has_cardiorenal_driver,
        has_CKD,
        advanced_CKD,
        SGLT2_low_glycemic_effect
      };

      return {
        status: "ok",
        message: "Algorithm completed for type 2 diabetes.",
        preferred_classes: preferred,
        acceptable_classes: acceptable,
        avoid_classes: avoid,
        rationale: dedupe(rationale),
        derived_flags
      };
    }

    function updateCounts(result) {
      dom.preferredCount.textContent = result.preferred_classes.length;
      dom.acceptableCount.textContent = result.acceptable_classes.length;
      dom.avoidCount.textContent = result.avoid_classes.length;
    }

    function renderStatus(result) {
      let tone = "ok";
      let title = "Recommendation ready";
      let message = result.message;

      if (result.status === "redirect") {
        tone = "warning";
        title = "Out of scope";
      } else if (result.status === "error") {
        tone = "danger";
        title = "Cannot run algorithm";
      } else if (result.derived_flags?.severe_hyperglycemia) {
        tone = "warning";
        title = "Urgent branch triggered";
        message = "Severe hyperglycemia criteria are present, so basal insulin rises to the top of the board.";
      }

      dom.statusBanner.dataset.tone = tone;
      dom.statusBanner.innerHTML = `
        <strong>${title}</strong>
        <p>${message}</p>
      `;
    }

    function renderLane(lane, classIds, container, state) {
      if (!classIds.length) {
        container.innerHTML = `
          <div class="empty-state">
            No classes are currently listed in this lane for the entered profile.
          </div>
        `;
        return;
      }

      container.innerHTML = classIds
        .map((classId, index) => renderClassCard(classId, lane, state, index))
        .join("");
    }

    function renderClassCard(classId, lane, state, rank = 0) {
      const meta = CLASS_META[classId];
      const drugs = groupedDrugs[classId] || [];
      const availableDrugs = drugs.filter((drug) => getDrugConflicts(drug, state).length === 0);
      const routeSummary = summariseValueList(drugs.map((drug) => prettifyValue(drug.route)));
      const costSummary = summariseValueList(drugs.map((drug) => prettifyValue(drug.rough_cost_level)));

      return `
        <article class="class-card">
          <header>
            <div>
              <h4>${meta.label}</h4>
              <p>${meta.description}</p>
            </div>
            <div class="chip-row">
              <span class="pill neutral">Priority ${rank + 1}</span>
              <span class="pill ${lane}">${lane}</span>
            </div>
          </header>
          <div class="class-meta">
            <span class="pill neutral">Route: ${routeSummary}</span>
            <span class="pill neutral">Cost: ${costSummary}</span>
            <span class="pill neutral">${availableDrugs.length}/${drugs.length} example drugs clear profile conflicts</span>
          </div>
          <ul class="class-list">
            ${drugs.map((drug) => {
              const conflicts = getDrugConflicts(drug, state);
              return `
                <li>
                  <span>${titleCase(drug.drug_name)}</span>
                  <small>${conflicts.length ? "Profile conflict" : "Available example"}</small>
                </li>
              `;
            }).join("")}
          </ul>
        </article>
      `;
    }

    function renderRationale(result) {
      if (!result.rationale.length) {
        dom.rationaleRow.innerHTML = `<span class="pill neutral">No rationale tags yet</span>`;
        return;
      }

      dom.rationaleRow.innerHTML = result.rationale
        .map((item) => `<span class="pill neutral">${item}</span>`)
        .join("");
    }

    function renderFlags(result) {
      const flags = [];
      const derived = result.derived_flags || {};

      if (derived.a1c_gap !== undefined) {
        flags.push(`A1C gap: ${formatGap(derived.a1c_gap)}%`);
      }
      if (derived.above_a1c_goal) flags.push("Above A1C goal");
      if (derived.severe_hyperglycemia) flags.push("Severe hyperglycemia");
      if (derived.has_cardiorenal_driver) flags.push("Cardiorenal driver present");
      if (derived.has_CKD) flags.push("CKD present");
      if (derived.advanced_CKD) flags.push("Advanced CKD");
      if (derived.SGLT2_low_glycemic_effect) flags.push("Reduced glycemic effect for SGLT2 at this eGFR");

      dom.flagRow.innerHTML = flags.length
        ? flags.map((item) => `<span class="pill neutral">${item}</span>`).join("")
        : `<span class="pill neutral">No derived flags triggered yet</span>`;
    }

    function buildCompareSelectors(result, state) {
      const optionGroups = [
        { label: "Preferred lane", ids: result.preferred_classes },
        { label: "Acceptable lane", ids: result.acceptable_classes },
        { label: "Avoid lane", ids: result.avoid_classes }
      ];

      const rendered = [];
      const usedDrugNames = new Set();

      optionGroups.forEach((group) => {
        const options = group.ids
          .flatMap((classId) => (groupedDrugs[classId] || []).map((drug) => ({ drug, classId })))
          .filter(({ drug }) => {
            if (usedDrugNames.has(drug.drug_name)) {
              return false;
            }
            usedDrugNames.add(drug.drug_name);
            return true;
          })
          .map(({ drug, classId }) =>
            `<option value="${drug.drug_name}">${group.label} • ${titleCase(drug.drug_name)} (${CLASS_META[classId].label})</option>`)
          .join("");

        if (options) {
          rendered.push(`<optgroup label="${group.label}">${options}</optgroup>`);
        }
      });

      const leftovers = DRUG_DATA.drugs
        .filter((drug) => !usedDrugNames.has(drug.drug_name))
        .map((drug) => {
          const classId = mapDrugClassToId(drug.drug_class);
          return `<option value="${drug.drug_name}">Other • ${titleCase(drug.drug_name)} (${CLASS_META[classId].label})</option>`;
        })
        .join("");

      if (leftovers) {
        rendered.push(`<optgroup label="Other catalog drugs">${leftovers}</optgroup>`);
      }

      dom.compareLeft.innerHTML = rendered.join("");
      dom.compareRight.innerHTML = rendered.join("");

      const recommendedDrugNames = [
        ...result.preferred_classes.flatMap((classId) => (groupedDrugs[classId] || []).map((drug) => drug.drug_name)),
        ...result.acceptable_classes.flatMap((classId) => (groupedDrugs[classId] || []).map((drug) => drug.drug_name)),
        ...result.avoid_classes.flatMap((classId) => (groupedDrugs[classId] || []).map((drug) => drug.drug_name)),
        ...DRUG_DATA.drugs.map((drug) => drug.drug_name)
      ].filter((value, index, array) => array.indexOf(value) === index);

      const leftFallback = recommendedDrugNames[0] || "";
      const rightFallback = recommendedDrugNames.find((name) => name !== leftFallback) || leftFallback;

      if (!recommendedDrugNames.includes(compareState.left)) {
        compareState.left = leftFallback;
      }

      if (!recommendedDrugNames.includes(compareState.right) || compareState.right === compareState.left) {
        compareState.right = rightFallback;
      }

      dom.compareLeft.value = compareState.left;
      dom.compareRight.value = compareState.right;
    }

    function renderCompareCards(result, state) {
      renderDrugCard(findDrug(compareState.left), dom.compareLeftCard, result, state);
      renderDrugCard(findDrug(compareState.right), dom.compareRightCard, result, state);
    }

    function renderDrugCard(drug, container, result, state) {
      if (!drug) {
        container.innerHTML = `
          <div class="empty-state">Select a drug to compare.</div>
        `;
        return;
      }

      const classId = mapDrugClassToId(drug.drug_class);
      const lane = getLaneForClass(classId, result);
      const conflicts = getDrugConflicts(drug, state);
      const laneLabel = lane === "neutral" ? "Not currently ranked" : `${titleCase(lane)} lane`;

      container.innerHTML = `
        <header>
          <div>
            <h4>${titleCase(drug.drug_name)}</h4>
            <p>${CLASS_META[classId].label}</p>
          </div>
          <div class="chip-row">
            <span class="pill ${lane}">${laneLabel}</span>
            ${conflicts.length ? `<span class="pill avoid">Profile conflict</span>` : `<span class="pill neutral">No direct conflict detected</span>`}
          </div>
        </header>

        <div class="metric-grid">
          <div class="metric">
            <strong>Route</strong>
            <span>${prettifyValue(drug.route)}</span>
          </div>
          <div class="metric">
            <strong>Rough cost</strong>
            <span>${prettifyValue(drug.rough_cost_level)}</span>
          </div>
          <div class="metric">
            <strong>Weight effect</strong>
            <span>${prettifyWeightEffect(drug.weight_effect)}</span>
          </div>
          <div class="metric">
            <strong>Hypoglycemia risk</strong>
            <span>${prettifyValue(drug.hypoglycemia_risk)}</span>
          </div>
        </div>

        <div class="callout">
          <strong>Major cautions</strong>
          <ul class="drug-list">
            ${drug.major_cautions.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </div>

        ${conflicts.length
          ? `
            <div class="callout warning">
              <strong>Profile conflicts</strong>
              <ul>
                ${conflicts.map((item) => `<li>${item}</li>`).join("")}
              </ul>
            </div>
          `
          : `
            <div class="callout">
              <strong>Profile fit</strong>
              <ul>
                <li>No exclusion flags from the medication catalog are currently triggered for this drug.</li>
              </ul>
            </div>
          `}
      `;
    }

    function getLaneForClass(classId, result) {
      if (result.preferred_classes.includes(classId)) return "preferred";
      if (result.acceptable_classes.includes(classId)) return "acceptable";
      if (result.avoid_classes.includes(classId)) return "avoid";
      return "neutral";
    }

    function findDrug(drugName) {
      return DRUG_DATA.drugs.find((drug) => drug.drug_name === drugName) || null;
    }

    function groupDrugsByClass(drugs) {
      return drugs.reduce((accumulator, drug) => {
        const key = mapDrugClassToId(drug.drug_class);
        if (!accumulator[key]) {
          accumulator[key] = [];
        }
        accumulator[key].push(drug);
        return accumulator;
      }, {});
    }

    function mapDrugClassToId(drugClass) {
      switch (drugClass) {
        case "metformin":
          return "metformin";
        case "SGLT2 inhibitor":
          return "SGLT2i";
        case "GLP-1 RA":
          return "GLP1_RA";
        case "dual GIP/GLP-1 RA":
          return "dual_GIP_GLP1_RA";
        case "DPP-4 inhibitor":
          return "DPP4i";
        case "pioglitazone":
          return "pioglitazone";
        case "basal insulin":
          return "basal_insulin";
        default:
          return "metformin";
      }
    }

    function getDrugConflicts(drug, state) {
      const profileFlags = {
        metformin_contraindicated: state.metformin_contraindicated,
        metformin_intolerance: false,
        sglt2i_contraindicated: state.SGLT2i_contraindicated,
        sglt2i_intolerance: false,
        glp1_ra_contraindicated: state.GLP1_RA_contraindicated,
        glp1_ra_intolerance: false,
        dual_gip_glp1_ra_contraindicated: state.dual_GIP_GLP1_RA_contraindicated,
        dual_gip_glp1_ra_intolerance: false,
        dpp4i_contraindicated: state.dpp4i_contraindicated,
        dpp4i_intolerance: false,
        pioglitazone_contraindicated: state.pioglitazone_contraindicated,
        pioglitazone_intolerance: false,
        basal_insulin_contraindicated: state.basal_insulin_contraindicated,
        prefers_oral_only: state.prefers_oral_only,
        has_hf: state.has_HF,
        on_glp1_based_therapy: state.on_GLP1_RA || state.on_dual_GIP_GLP1_RA
      };

      return (drug.key_exclusion_conditions || [])
        .filter((flag) => profileFlags[flag])
        .map(humaniseConflict);
    }

    function humaniseConflict(flag) {
      const labels = {
        metformin_contraindicated: "Metformin is marked contraindicated.",
        metformin_intolerance: "Metformin intolerance flag is present.",
        sglt2i_contraindicated: "SGLT2 inhibitors are marked contraindicated.",
        sglt2i_intolerance: "SGLT2 inhibitor intolerance flag is present.",
        glp1_ra_contraindicated: "GLP-1 receptor agonists are marked contraindicated.",
        glp1_ra_intolerance: "GLP-1 receptor agonist intolerance flag is present.",
        dual_gip_glp1_ra_contraindicated: "Dual GIP/GLP-1 therapy is marked contraindicated.",
        dual_gip_glp1_ra_intolerance: "Dual GIP/GLP-1 intolerance flag is present.",
        dpp4i_contraindicated: "DPP-4 inhibitors are marked contraindicated.",
        dpp4i_intolerance: "DPP-4 inhibitor intolerance flag is present.",
        pioglitazone_contraindicated: "Pioglitazone is marked contraindicated.",
        pioglitazone_intolerance: "Pioglitazone intolerance flag is present.",
        basal_insulin_contraindicated: "Basal insulin is marked contraindicated.",
        prefers_oral_only: "The patient prefers oral-only therapy.",
        has_hf: "Heart failure is present.",
        on_glp1_based_therapy: "The patient is already on GLP-1-based therapy."
      };
      return labels[flag] || titleCase(flag.replaceAll("_", " "));
    }

    function addUnique(list, item) {
      if (item && !list.includes(item)) {
        list.push(item);
      }
    }

    function removeIfPresent(item, list) {
      const index = list.indexOf(item);
      if (index >= 0) {
        list.splice(index, 1);
      }
    }

    function moveUpIfPresent(item, preferred, acceptable) {
      if (acceptable.includes(item)) {
        removeIfPresent(item, acceptable);
        preferred.unshift(item);
        return;
      }

      if (preferred.includes(item)) {
        removeIfPresent(item, preferred);
        preferred.unshift(item);
      }
    }

    function moveDownIfPresent(item, preferred, acceptable) {
      if (preferred.includes(item)) {
        removeIfPresent(item, preferred);
        acceptable.push(item);
        return;
      }

      if (acceptable.includes(item)) {
        removeIfPresent(item, acceptable);
        acceptable.push(item);
      }
    }

    function dedupe(list) {
      return list.filter((item, index) => list.indexOf(item) === index);
    }

    function toNumber(value, fallback) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    }

    function roundToOne(value) {
      return Math.round(value * 10) / 10;
    }

    function titleCase(value) {
      return String(value)
        .split(" ")
        .map((word) => word ? word.charAt(0).toUpperCase() + word.slice(1) : "")
        .join(" ");
    }

    function prettifyValue(value) {
      return titleCase(String(value).replaceAll("_", " "));
    }

    function prettifyWeightEffect(value) {
      const labels = {
        neutral: "Neutral",
        gain: "Gain",
        loss_modest: "Modest loss",
        loss_moderate: "Moderate loss",
        loss_high: "High loss"
      };
      return labels[value] || prettifyValue(value);
    }

    function summariseValueList(values) {
      const unique = [...new Set(values)];
      return unique.join(" / ");
    }

    function formatGap(value) {
      const absValue = Math.abs(value).toFixed(1);
      return value >= 0 ? absValue : `-${absValue}`;
    }

    function persistState() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          state: latestState,
          answeredQuestionIds: wizardSession.answeredQuestionIds,
          questionHistory: wizardSession.questionHistory,
          currentQuestionId: wizardSession.currentQuestionId
        }));
      } catch (error) {
        // Ignore storage failures in restricted environments.
      }
    }

    function loadStoredState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (error) {
        return null;
      }
    }

    async function loadDrugData() {
      const jsonUrl = new URL("./Drugs.json", import.meta.url);
      const response = await fetch(jsonUrl);

      if (!response.ok) {
        throw new Error(`Unable to load drug data: ${response.status} ${response.statusText}`.trim());
      }

      const data = await response.json();

      if (!data || !Array.isArray(data.drugs)) {
        throw new Error("Drugs.json must contain a top-level drugs array.");
      }

      return data;
    }

    function showInitializationError(error) {
      console.error("Unable to initialize drug recommendation app.", error);

      const protocolHint = window.location.protocol === "file:"
        ? " This browser may block local JSON requests from file:// pages, so opening the folder with a small local web server is more reliable."
        : "";

      const message = `The app could not load Drugs.json.${protocolHint}`;
      const statusBanner = document.getElementById("status-banner");
      const wizardStageLabel = document.getElementById("wizard-stage-label");
      const wizardProgressCopy = document.getElementById("wizard-progress-copy");
      const questionStage = document.getElementById("question-stage");
      const questionTitle = document.getElementById("question-title");
      const questionHelp = document.getElementById("question-help");
      const questionInputArea = document.getElementById("question-input-area");

      if (wizardStageLabel) {
        wizardStageLabel.textContent = "Drug data unavailable";
      }

      if (wizardProgressCopy) {
        wizardProgressCopy.textContent = message;
      }

      if (questionStage) {
        questionStage.textContent = "Catalog load error";
      }

      if (questionTitle) {
        questionTitle.textContent = "Unable to load the medication catalog.";
      }

      if (questionHelp) {
        questionHelp.textContent = "Keep Drugs.json in the same folder as the app files and retry.";
      }

      if (questionInputArea) {
        questionInputArea.innerHTML = `<div class="empty-state">${message}</div>`;
      }

      if (statusBanner) {
        statusBanner.dataset.tone = "danger";
        statusBanner.innerHTML = `
          <strong>Medication catalog unavailable</strong>
          <p>${message}</p>
        `;
      }
    }

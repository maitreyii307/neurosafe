import { useEffect, useState } from "react";
import "./RoutineManager.css";

const STORAGE_KEY = "neurosafe-routines";

const DEFAULT_ROUTINE = {
  id: "before-leaving",
  name: "Before Leaving the House",
  steps: [
    { id: "step-1", emoji: "🚿", label: "Get ready" },
    { id: "step-2", emoji: "🎒", label: "Pack my bag" },
    { id: "step-3", emoji: "📱", label: "Take my phone" },
    { id: "step-4", emoji: "🔑", label: "Take my keys" },
    { id: "step-5", emoji: "💧", label: "Take water" },
    { id: "step-6", emoji: "🚪", label: "Lock the door" },
  ],
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function loadRoutines() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [DEFAULT_ROUTINE];
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [DEFAULT_ROUTINE];
    }

    const validRoutines = parsed.filter(
      (routine) =>
        routine &&
        typeof routine.id === "string" &&
        typeof routine.name === "string" &&
        Array.isArray(routine.steps)
    );

    if (validRoutines.length === 0) {
      return [DEFAULT_ROUTINE];
    }

    return validRoutines;
  } catch (error) {
    console.error("Could not load routines:", error);
    return [DEFAULT_ROUTINE];
  }
}

export default function RoutineManager() {
  const [routines, setRoutines] = useState(loadRoutines);

  const [selectedRoutineId, setSelectedRoutineId] = useState(
    () => loadRoutines()[0]?.id || null
  );

  const [mode, setMode] = useState("steps");
  const [currentStep, setCurrentStep] = useState(0);
  const [checkedSteps, setCheckedSteps] = useState({});

  const [showEditor, setShowEditor] = useState(false);
  const [editingRoutineId, setEditingRoutineId] = useState(null);

  const [routineName, setRoutineName] = useState("");
  const [steps, setSteps] = useState([]);

  const [newEmoji, setNewEmoji] = useState("⭐");
  const [newStep, setNewStep] = useState("");

  const selectedRoutine =
    routines.find(
      (routine) => routine.id === selectedRoutineId
    ) || routines[0] || null;

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(routines)
      );
    } catch (error) {
      console.error("Could not save routines:", error);
    }
  }, [routines]);

  useEffect(() => {
    if (selectedRoutine && selectedRoutine.id !== selectedRoutineId) {
      setSelectedRoutineId(selectedRoutine.id);
    }
  }, [selectedRoutine, selectedRoutineId]);

  useEffect(() => {
    if (!selectedRoutine) {
      setCurrentStep(0);
      setCheckedSteps({});
      return;
    }

    if (selectedRoutine.steps.length === 0) {
      setCurrentStep(0);
      return;
    }

    if (currentStep >= selectedRoutine.steps.length) {
      setCurrentStep(selectedRoutine.steps.length - 1);
    }
  }, [selectedRoutine, currentStep]);

  const selectRoutine = (id) => {
    setSelectedRoutineId(id);
    setCurrentStep(0);
    setCheckedSteps({});
    setMode("steps");
  };

  const startCreating = () => {
    setEditingRoutineId(null);
    setRoutineName("");
    setSteps([]);
    setNewEmoji("⭐");
    setNewStep("");
    setShowEditor(true);
  };

  const startEditing = (routine) => {
    setEditingRoutineId(routine.id);
    setRoutineName(routine.name);
    setSteps(
      routine.steps.map((step) => ({
        ...step,
        id: step.id || createId(),
        emoji: step.emoji || "⭐",
        label: step.label || "",
      }))
    );
    setNewEmoji("⭐");
    setNewStep("");
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditingRoutineId(null);
    setRoutineName("");
    setSteps([]);
    setNewEmoji("⭐");
    setNewStep("");
  };

  const addStep = () => {
    const label = newStep.trim();

    if (!label) {
      return;
    }

    const step = {
      id: createId(),
      emoji: newEmoji.trim() || "⭐",
      label,
    };

    setSteps((previous) => [...previous, step]);
    setNewStep("");
  };

  const removeStep = (id) => {
    setSteps((previous) =>
      previous.filter((step) => step.id !== id)
    );
  };

  const moveStep = (index, direction) => {
    const newIndex = index + direction;

    if (
      newIndex < 0 ||
      newIndex >= steps.length
    ) {
      return;
    }

    setSteps((previous) => {
      const updated = [...previous];

      const temp = updated[index];
      updated[index] = updated[newIndex];
      updated[newIndex] = temp;

      return updated;
    });
  };

  const saveRoutine = () => {
    const name = routineName.trim();

    if (!name) {
      window.alert("Please enter a routine name.");
      return;
    }

    if (steps.length === 0) {
      window.alert("Please add at least one step.");
      return;
    }

    const cleanedSteps = steps.map((step) => ({
      id: step.id || createId(),
      emoji: step.emoji?.trim() || "⭐",
      label: step.label.trim(),
    }));

    if (editingRoutineId) {
      setRoutines((previous) =>
        previous.map((routine) =>
          routine.id === editingRoutineId
            ? {
                ...routine,
                name,
                steps: cleanedSteps,
              }
            : routine
        )
      );

      setSelectedRoutineId(editingRoutineId);
    } else {
      const newRoutine = {
        id: createId(),
        name,
        steps: cleanedSteps,
      };

      setRoutines((previous) => [
        ...previous,
        newRoutine,
      ]);

      setSelectedRoutineId(newRoutine.id);
    }

    setCurrentStep(0);
    setCheckedSteps({});
    setMode("steps");
    closeEditor();
  };

  const deleteRoutine = (id) => {
    const routine = routines.find(
      (item) => item.id === id
    );

    if (!routine) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${routine.name}"?`
    );

    if (!confirmed) {
      return;
    }

    const remaining = routines.filter(
      (item) => item.id !== id
    );

    setRoutines(remaining);
    setCurrentStep(0);
    setCheckedSteps({});

    if (remaining.length > 0) {
      setSelectedRoutineId(remaining[0].id);
      setMode("steps");
    } else {
      setSelectedRoutineId(null);
    }
  };

  const toggleStep = (id) => {
    setCheckedSteps((previous) => ({
      ...previous,
      [id]: !previous[id],
    }));
  };

  const nextStep = () => {
    if (!selectedRoutine) {
      return;
    }

    if (
      currentStep <
      selectedRoutine.steps.length - 1
    ) {
      setCurrentStep(
        (previous) => previous + 1
      );
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(
        (previous) => previous - 1
      );
    }
  };

  const resetRoutine = () => {
    setCurrentStep(0);
    setCheckedSteps({});
  };

  const handleStepKeyDown = (event, index) => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveStep(index, -1);
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveStep(index, 1);
    }
  };

  /*
   * EDITOR
   */

  if (showEditor) {
    return (
      <div className="routine-card">
        <div className="routine-header">
          <div>
            <p className="routine-eyebrow">
              {editingRoutineId
                ? "EDIT ROUTINE"
                : "NEW ROUTINE"}
            </p>

            <h2>
              {editingRoutineId
                ? "Edit routine"
                : "Create a routine"}
            </h2>

            <p>
              Add the steps in the order you want
              to complete them.
            </p>
          </div>
        </div>

        <div className="routine-form">
          <label htmlFor="routine-name">
            Routine name
          </label>

          <input
            id="routine-name"
            type="text"
            value={routineName}
            onChange={(event) =>
              setRoutineName(event.target.value)
            }
            placeholder="e.g. Morning routine"
          />

          <div className="add-step-row">
            <div className="emoji-input">
              <label htmlFor="step-emoji">
                Emoji
              </label>

              <input
                id="step-emoji"
                type="text"
                value={newEmoji}
                onChange={(event) =>
                  setNewEmoji(event.target.value)
                }
              />
            </div>

            <div className="step-text-input">
              <label htmlFor="step-name">
                Step
              </label>

              <input
                id="step-name"
                type="text"
                value={newStep}
                onChange={(event) =>
                  setNewStep(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addStep();
                  }
                }}
                placeholder="e.g. Brush my teeth"
              />
            </div>

            <button
              type="button"
              className="routine-button primary"
              onClick={addStep}
            >
              Add step
            </button>
          </div>

          <div className="editor-list">
            {steps.length === 0 ? (
              <div className="empty-steps">
                No steps added yet.
              </div>
            ) : (
              steps.map((step, index) => (
                <div
                  className="editor-step"
                  key={step.id}
                  tabIndex={0}
                  onKeyDown={(event) =>
                    handleStepKeyDown(
                      event,
                      index
                    )
                  }
                >
                  <span className="step-number">
                    {index + 1}
                  </span>

                  <span className="step-emoji">
                    {step.emoji}
                  </span>

                  <span className="editor-step-label">
                    {step.label}
                  </span>

                  <div className="reorder-buttons">
                    <button
                      type="button"
                      aria-label={`Move ${step.label} up`}
                      disabled={index === 0}
                      onClick={() =>
                        moveStep(index, -1)
                      }
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      aria-label={`Move ${step.label} down`}
                      disabled={
                        index ===
                        steps.length - 1
                      }
                      onClick={() =>
                        moveStep(index, 1)
                      }
                    >
                      ↓
                    </button>
                  </div>

                  <button
                    type="button"
                    className="delete-step"
                    aria-label={`Remove ${step.label}`}
                    onClick={() =>
                      removeStep(step.id)
                    }
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="editor-actions">
            <button
              type="button"
              className="routine-button secondary"
              onClick={closeEditor}
            >
              Cancel
            </button>

            <button
              type="button"
              className="routine-button primary"
              onClick={saveRoutine}
            >
              Save routine
            </button>
          </div>
        </div>
      </div>
    );
  }

  /*
   * NO ROUTINES
   */

  if (!selectedRoutine) {
    return (
      <div className="routine-card">
        <div className="empty-routines">
          <h2>No routines yet</h2>

          <p>
            Create your first routine to get
            started.
          </p>

          <button
            type="button"
            className="routine-button primary"
            onClick={startCreating}
          >
            Create routine
          </button>
        </div>
      </div>
    );
  }

  /*
   * SAFETY CHECK
   */

  if (
    !Array.isArray(selectedRoutine.steps) ||
    selectedRoutine.steps.length === 0
  ) {
    return (
      <div className="routine-card">
        <div className="empty-routines">
          <h2>This routine has no steps</h2>

          <p>
            Edit the routine and add at least one
            step.
          </p>

          <button
            type="button"
            className="routine-button primary"
            onClick={() =>
              startEditing(selectedRoutine)
            }
          >
            Edit routine
          </button>
        </div>
      </div>
    );
  }

  const safeCurrentStep = Math.min(
    currentStep,
    selectedRoutine.steps.length - 1
  );

  const activeStep =
    selectedRoutine.steps[safeCurrentStep];

  const completedCount =
    selectedRoutine.steps.filter(
      (step) => checkedSteps[step.id]
    ).length;

  const progress =
    ((safeCurrentStep + 1) /
      selectedRoutine.steps.length) *
    100;

  /*
   * MAIN VIEW
   */

  return (
    <div className="routine-card">
      <div className="routine-header">
        <div>
          <p className="routine-eyebrow">
            MY ROUTINES
          </p>

          <h2>Routine Manager</h2>

          <p>
            Follow a routine step by step or use
            it as a checklist.
          </p>
        </div>

        <button
          type="button"
          className="routine-button primary"
          onClick={startCreating}
        >
          + New routine
        </button>
      </div>

      {/* ROUTINE SELECTOR */}

      <div className="routine-selector">
        {routines.map((routine) => (
          <button
            type="button"
            key={routine.id}
            className={
              routine.id ===
              selectedRoutineId
                ? "routine-tab active"
                : "routine-tab"
            }
            onClick={() =>
              selectRoutine(routine.id)
            }
          >
            {routine.name}
          </button>
        ))}
      </div>

      {/* ROUTINE HEADER */}

      <div className="selected-routine-header">
        <div>
          <h3>{selectedRoutine.name}</h3>

          <span>
            {selectedRoutine.steps.length} steps
          </span>
        </div>

        <div className="routine-management">
          <button
            type="button"
            onClick={() =>
              startEditing(selectedRoutine)
            }
          >
            Edit
          </button>

          <button
            type="button"
            className="danger-text"
            onClick={() =>
              deleteRoutine(
                selectedRoutine.id
              )
            }
          >
            Delete
          </button>
        </div>
      </div>

      {/* MODE SELECTOR */}

      <div className="mode-selector">
        <button
          type="button"
          className={
            mode === "steps"
              ? "mode-button active"
              : "mode-button"
          }
          onClick={() => {
            setMode("steps");
            setCurrentStep(0);
          }}
        >
          ▶ Step by step
        </button>

        <button
          type="button"
          className={
            mode === "checklist"
              ? "mode-button active"
              : "mode-button"
          }
          onClick={() =>
            setMode("checklist")
          }
        >
          ☑ Checklist
        </button>
      </div>

      {/* STEP BY STEP */}

      {mode === "steps" && (
        <div className="step-view">
          <div className="progress-info">
            <span>
              Step {safeCurrentStep + 1} of{" "}
              {selectedRoutine.steps.length}
            </span>

            <span>
              {Math.round(progress)}%
            </span>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <div
            className="current-step"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="current-step-number">
              {safeCurrentStep + 1}
            </div>

            <div className="current-step-emoji">
              {activeStep?.emoji || "⭐"}
            </div>

            <h3>
              {activeStep?.label ||
                "Complete this step"}
            </h3>

            <p>
              {safeCurrentStep ===
              selectedRoutine.steps.length - 1
                ? "This is the last step."
                : "Complete this step, then continue when you're ready."}
            </p>
          </div>

          <div className="step-navigation">
            <button
              type="button"
              className="routine-button secondary"
              disabled={safeCurrentStep === 0}
              onClick={previousStep}
            >
              ← Previous
            </button>

            {safeCurrentStep <
            selectedRoutine.steps.length - 1 ? (
              <button
                type="button"
                className="routine-button primary"
                onClick={nextStep}
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                className="routine-button success"
                onClick={resetRoutine}
              >
                ✓ Finished
              </button>
            )}
          </div>

          <button
            type="button"
            className="reset-button"
            onClick={resetRoutine}
          >
            Start again
          </button>
        </div>
      )}

      {/* CHECKLIST */}

      {mode === "checklist" && (
        <div className="checklist-view">
          <div className="checklist-summary">
            <strong>
              {completedCount} of{" "}
              {selectedRoutine.steps.length}
            </strong>

            <span>completed</span>
          </div>

          <div className="checklist">
            {selectedRoutine.steps.map(
              (step, index) => {
                const isChecked =
                  !!checkedSteps[step.id];

                return (
                  <label
                    className={
                      isChecked
                        ? "checklist-item checked"
                        : "checklist-item"
                    }
                    key={step.id}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() =>
                        toggleStep(step.id)
                      }
                    />

                    <span className="custom-checkbox">
                      {isChecked ? "✓" : ""}
                    </span>

                    <span className="checklist-number">
                      {index + 1}
                    </span>

                    <span className="checklist-emoji">
                      {step.emoji}
                    </span>

                    <span className="checklist-label">
                      {step.label}
                    </span>
                  </label>
                );
              }
            )}
          </div>

          {completedCount ===
            selectedRoutine.steps.length && (
            <div
              className="completion-message"
              aria-live="polite"
            >
              <span>🎉</span>

              <div>
                <strong>
                  Routine complete!
                </strong>

                <p>
                  You've finished every step.
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            className="reset-button"
            onClick={resetRoutine}
          >
            Reset checklist
          </button>
        </div>
      )}
    </div>
  );
}
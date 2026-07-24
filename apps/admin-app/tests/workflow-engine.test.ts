import { describe, expect, it } from "vitest";
import { defaultWorkflows, nextMissionStatus, workflowDefinitionSchema } from "../src/lib/workflow-engine";

describe("workflow engine", () => {
  it("blocks transitions that bypass mandatory validation", () => {
    expect(() => nextMissionStatus("in_progress", "close")).toThrow(/workflow/u);
    expect(() => nextMissionStatus("awaiting_validation", "close")).toThrow(/workflow/u);
  });

  it("allows correction and controlled closure", () => {
    expect(nextMissionStatus("awaiting_validation", "request_correction")).toBe("correction_required");
    expect(nextMissionStatus("awaiting_validation", "validate")).toBe("validated");
    expect(nextMissionStatus("validated", "close")).toBe("closed");
  });

  it("ships one valid default workflow per direction", () => {
    expect(defaultWorkflows).toHaveLength(8);
    for (const workflow of defaultWorkflows) expect(workflowDefinitionSchema.parse(workflow).steps).toHaveLength(4);
  });
});

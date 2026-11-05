import { readFileSync } from "fs"
import path from "path"
import { describe, expect, test } from "bun:test"

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8")
}

// lfg's front half became an outcome spine with four routes to a work source
// (2026-09). The body keeps the work-source invariant and the route summary;
// references/intake.md owns the routes, and two new return-to-caller seams
// (ce-debug, ce-brainstorm) feed it. These pins hold the seams together: each
// side is edited independently, so a renamed token or status on one end must
// fail here rather than in a live run.

const lfg = readRepoFile("skills/lfg/SKILL.md")
const intake = readRepoFile("skills/lfg/references/intake.md")
const debugReturnGate = readRepoFile("skills/lfg/references/debug-return.md")
const debugReturn = readRepoFile("skills/ce-debug/references/return-to-caller.md")
const debugSkill = readRepoFile("skills/ce-debug/SKILL.md")
const brainstormSkill = readRepoFile("skills/ce-brainstorm/SKILL.md")
const brainstormHandoff = readRepoFile("skills/ce-brainstorm/references/handoff.md")
const workTriage = readRepoFile("skills/ce-work/references/input-triage.md")
const workReturnGate = readRepoFile("skills/lfg/references/work-return.md")
const planBrief = readRepoFile("skills/lfg/references/plan-brief.md")
const reviewFollowup = readRepoFile("skills/lfg/references/review-followup.md")
const shippingTail = readRepoFile("skills/lfg/references/shipping.md")

describe("lfg work source and routes", () => {
  test("the body names the routes and the intake owner before any step", () => {
    const routeClause = lfg.indexOf("**Route by what the request is.**")
    const runHeading = lfg.indexOf("## The run")
    expect(routeClause).toBeGreaterThan(-1)
    expect(routeClause).toBeLessThan(runHeading)
    expect(lfg).toContain("references/intake.md")
    for (const child of ["`ce-debug`", "`ce-pov`", "`ce-brainstorm`", "`ce-plan`", "`ce-prototype`", "`ce-explain`", "`ce-ideate`"]) {
      expect(lfg.slice(routeClause, runHeading)).toContain(child)
    }
  })

  test("only a verified plan or a fixed debug return is a work source, and nothing is discovered on disk", () => {
    expect(lfg).toMatch(/only two things qualify/)
    expect(lfg).toMatch(/`fixed` return from `ce-debug`/)
    expect(lfg).toMatch(/Never search the plans directory/)
    // ce-work's blank-invocation discovery exists; lfg must never reach it.
    expect(workTriage).toContain("**Blank invocation latest-plan discovery:**")
    expect(intake).toMatch(/`lfg` never invokes `ce-work` blank/)
  })

  test("a same-session plan goes straight to ce-work; older or requirements-only plans go through ce-plan", () => {
    expect(intake).toMatch(/wrote in this session[\s\S]{0,200}invokes `ce-work` on it directly/)
    expect(intake).toMatch(/requirements-only artifact, or a path to a plan from an earlier session[\s\S]{0,120}invoke `ce-plan`/)
    // The this-run gate stays on the plan route; plan-brief records the bypass.
    expect(lfg).toContain("a plan file `ce-plan` reported writing this run")
    expect(planBrief).toMatch(/bypasses `ce-plan` per `references\/intake\.md`/)
  })

  test("every ce-pov grade has a rule and the verdict never becomes a settled decision", () => {
    for (const grade of ["Adopt", "Trial", "Reject", "Hold", "Not-our-problem", "Blocked"]) {
      expect(intake).toContain(grade)
    }
    expect(intake).toMatch(/never as a settled decision/)
    expect(lfg).toMatch(/only a verdict that supports the change continues/)
    // A judgment-only request ends at the verdict; route 3 needs change intent (Codex round 2).
    expect(lfg).toMatch(/a judgment with nothing to build ends at the verdict/)
    expect(intake).toMatch(/Judgment on the way to a change\.\*\* The request asks for a change to the code/)
    // Codex round 3: a plan path alone does not select the plan route.
    expect(intake).toMatch(/Plan path\.\*\* The request asks for a plan to be carried out or continued/)
  })

  test("a non-code result ends the run at that skill, with no branch", () => {
    expect(intake).toMatch(/A result that is not a code change/)
    expect(intake).toMatch(/with no branch, no work source/)
    expect(lfg).toMatch(/that invocation is the whole run/)
    expect(intake).toMatch(/The examples are not the list; the host's skill catalog is/)
  })

  test("interaction is limited to ce-brainstorm with a human present", () => {
    expect(lfg).toMatch(/Ask the user only through `ce-brainstorm`, and only when a human is present/)
    expect(intake).toMatch(/When no human is present, take route 6/)
  })

  test("compound runs before shipping so the learning is in the PR at open", () => {
    const compound = lfg.indexOf("7. Invoke the `ce-compound` skill")
    const ship = lfg.indexOf("invoke the `ce-commit-push-pr` skill")
    expect(compound).toBeGreaterThan(-1)
    expect(compound).toBeLessThan(ship)
    expect(lfg).toContain("mode:non-interactive")
    expect(reviewFollowup).toContain("## Step 7 — compound before shipping")
  })
})

describe("ce-debug return-to-caller seam (ce-debug <-> lfg)", () => {
  const STATUSES = ["fixed", "diagnosed-no-fix", "needs-human", "blocked"]
  const DEBUG_RETURN_FIELDS = [
    "status",
    "root_cause",
    "changed_files",
    "head_sha",
    "branch",
    "pre_fix_scope",
    "verification_evidence",
    "residuals",
    "issue_of_record",
    "behavior_change",
    "standalone_shipping_skipped",
  ]

  test("ce-debug documents the mode, its exact status vocabulary, and no push", () => {
    expect(debugSkill).toContain("**`mode:return-to-caller`**")
    expect(debugSkill).toContain("references/return-to-caller.md")
    expect(debugSkill).toContain("`fixed | diagnosed-no-fix | needs-human | blocked`")
    expect(debugReturn).toMatch(/never pushes and never asks/)
    expect(debugReturn).toMatch(/Branch\*\* rule in Phase 3 applies in full/)
    expect(debugReturn).toContain("mode:pipeline")
    const projectConventions = debugReturn.indexOf("project's commit message conventions already in context")
    const recentLog = debugReturn.indexOf("recent log pattern")
    const conventionalCommits = debugReturn.indexOf("conventional commits")
    expect(projectConventions).toBeGreaterThan(-1)
    expect(recentLog).toBeGreaterThan(projectConventions)
    expect(conventionalCommits).toBeGreaterThan(recentLog)
    expect(debugReturn).toContain("User override wins.")
    expect(debugReturn).toContain("conventional commits (`fix: <summary>` for this bug)")
  })

  test("both ends name the same statuses and return fields", () => {
    for (const status of STATUSES) {
      expect(debugReturn, `ce-debug must define ${status}`).toContain(`\`${status}\``)
    }
    expect(debugReturnGate).toContain("Only `status: fixed` advances")
    for (const status of ["diagnosed-no-fix", "needs-human", "blocked"]) {
      expect(debugReturnGate, `lfg gate must stop on ${status}`).toContain(`\`${status}\``)
    }
    for (const field of DEBUG_RETURN_FIELDS) {
      // ce-debug documents the field as a JSON key; lfg's gate names it in backticks.
      expect(debugReturn, `ce-debug must return ${field}`).toMatch(new RegExp('"' + field + '":'))
      expect(debugReturnGate, `lfg must require ${field}`).toMatch(new RegExp("`" + field + "(?:`|:)"))
    }
  })

  test("the debug gate requires the same evidence facts the ce-work gate requires", () => {
    for (const phrase of [
      "existing tests inspected",
      "tests added/changed",
      "red failure or characterization",
      "verification run",
      "deliberate test exception",
      "Do NOT decide the test strategy inside LFG",
    ]) {
      expect(workReturnGate).toContain(phrase)
      expect(debugReturnGate).toContain(phrase)
    }
    expect(debugReturnGate).toMatch(/There is no recovery invocation on this route/)
  })

  test("the defect route ships only what the user offered", () => {
    // Codex rounds 1-3 on #1702 each found a new edge in a mechanism-shaped gate; the
    // block is stated as its goal and safe direction, and ce-debug returns facts only.
    expect(debugReturn).toMatch(/"pre_fix_scope"/)
    expect(debugReturn).toMatch(/"dirty_files"/)
    expect(debugReturn).toMatch(/"commits_beyond_base"/)
    expect(debugReturn).toMatch(/carries no verdict about what the user offered/)
    expect(debugReturnGate).toMatch(/Before any step in this run pushes, a review-fix commit included, decide whether everything that push would publish is offered/)
    expect(debugReturnGate).toMatch(/When it is not, or you cannot tell, hold/)
    expect(reviewFollowup).toMatch(/when everything the push would publish is work the user offered/)
    expect(shippingTail).not.toContain("git add -A && git commit")
    expect(shippingTail).toMatch(/Never `git add -A`/)
  })

  test("a prototype route requires a human present on both ends", () => {
    expect(intake).toMatch(/runs only when a human is present \(the same condition route 4 uses\)/)
    const prototype = readRepoFile("skills/ce-prototype/SKILL.md")
    expect(prototype).not.toMatch(/no person to experience the prototype — LFG/)
    expect(prototype).toMatch(/a calling skill that reports no human is present/)
  })

  test("the shipping steps name a substitute for every consumer of the plan path", () => {
    for (const consumer of ["`ce-simplify-code`", "`ce-code-review`", "`ce-commit-push-pr`", "`ce-compound`"]) {
      expect(debugReturnGate).toContain(consumer)
    }
    expect(reviewFollowup).toMatch(/On the defect route[^\n]*omit `plan:`/)
    expect(shippingTail).toMatch(/On the defect route[^\n]*`root_cause` and `issue_of_record`/)
    expect(shippingTail).toMatch(/On the defect route there is no plan: make no next-work offer/)
  })
})

describe("ce-brainstorm return-to-caller seam (ce-brainstorm <-> lfg)", () => {
  const BRAINSTORM_RETURN_FIELDS = ["status", "result_kind", "artifact_path", "brief", "resolve_before_planning"]

  test("ce-brainstorm documents the mode in the body and the return in the handoff owner", () => {
    expect(brainstormSkill).toContain("**`mode:return-to-caller`**")
    expect(brainstormSkill).toMatch(/no menu, no `lfg` or `ce-plan` invocation/)
    expect(brainstormHandoff).toContain("#### 4.0 Return to the caller instead of presenting options")
    expect(brainstormHandoff).toMatch(/never an invocation of `lfg` or\s+`ce-plan` from here/)
    for (const field of BRAINSTORM_RETURN_FIELDS) {
      expect(brainstormHandoff).toContain(`\`${field}\``)
      expect(intake).toContain(`\`${field}\``)
    }
  })

  test("lfg treats an artifact as the plan route and a brief as a feature description, never a work source", () => {
    expect(intake).toMatch(/An `artifact` result enters route 1/)
    expect(intake).toMatch(/A `brief` result enters route 6/)
    expect(brainstormHandoff).toMatch(/A `brief` is a feature description[^.]*not a plan and\s+not a work source/)
    // The interactive menu's own lfg option still hands over the artifact path.
    expect(brainstormHandoff).toContain("Ship it autonomously with `lfg`")
  })
})

// 2026-09-14: an lfg run ended its turn after ce-debug's return-to-caller
// output because the callee said "emit ... as the final output" and nothing at
// the caller said to continue. Children run inline, so a return is text the
// caller wrote and no event resumes it. Each callee return contract must not
// claim the turn, and lfg's completion rule must resume the next step.
describe("inline child returns do not end the caller's turn", () => {
  const calleeReturns: Record<string, string> = {
    "skills/ce-debug/SKILL.md": debugSkill,
    "skills/ce-debug/references/return-to-caller.md": debugReturn,
    "skills/ce-debug/references/pipeline-mode.md": readRepoFile("skills/ce-debug/references/pipeline-mode.md"),
    "skills/ce-work/references/return-to-caller.md": readRepoFile("skills/ce-work/references/return-to-caller.md"),
    "skills/ce-brainstorm/references/handoff.md": brainstormHandoff,
    "skills/ce-compound/references/report.md": readRepoFile("skills/ce-compound/references/report.md"),
    "skills/ce-plan/references/plan-handoff.md": readRepoFile("skills/ce-plan/references/plan-handoff.md"),
    "skills/ce-pov/references/invocation.md": readRepoFile("skills/ce-pov/references/invocation.md"),
    "skills/ce-doc-review/references/synthesis-and-presentation.md": readRepoFile("skills/ce-doc-review/references/synthesis-and-presentation.md"),
    "skills/ce-simplify-code/SKILL.md": readRepoFile("skills/ce-simplify-code/SKILL.md"),
    "skills/ce-code-review/references/modes-and-output.md": readRepoFile("skills/ce-code-review/references/modes-and-output.md"),
    "skills/ce-code-review/references/depth-paths.md": readRepoFile("skills/ce-code-review/references/depth-paths.md"),
    "skills/ce-code-review/references/finish-input.md": readRepoFile("skills/ce-code-review/references/finish-input.md"),
    "skills/ce-test-browser/references/pipeline-orchestration.md": readRepoFile("skills/ce-test-browser/references/pipeline-orchestration.md"),
    "skills/ce-commit-push-pr/references/apply-and-handoff.md": readRepoFile("skills/ce-commit-push-pr/references/apply-and-handoff.md"),
    "skills/ce-babysit-pr/references/pipeline.md": readRepoFile("skills/ce-babysit-pr/references/pipeline.md"),
  }

  test("callee return contracts say the return ends the skill, not the turn", () => {
    for (const [file, body] of Object.entries(calleeReturns)) {
      expect(body, `${file} must not present the return as the final output`).not.toMatch(/as the final output/)
      expect(body, `${file} must state the return ends the skill, not the turn`).toMatch(/ends (?:this|the) skill, not the turn/)
    }
  })

  test("lfg's completion rule resumes the next step after a child return", () => {
    const taskVisibility = readRepoFile("skills/lfg/references/task-visibility.md")
    expect(lfg).toMatch(/a child skill's return resumes the next numbered step in the same turn/)
    expect(taskVisibility).toMatch(/Its return ends the child, not the run: after writing or reading it, continue with the next numbered step in the same turn/)
  })
})

// WOR-92 (2026-10-23): lfg's close-out gained a pass that reviews the finished
// run for out-of-scope discoveries and packages each one. Three things about it
// are load-bearing and each is pinned below.
//
// Placement: the pass lives in the close-out, not in a numbered step. The body
// has 24 bytes of headroom under the ratchet in codex-skill-prompt-budget, so a
// numbered step cannot be added; the close-out is also the only point that sees
// the browser-test and CI-watching steps, where "broken tooling it worked
// around" actually surfaces. The slice pin fails if the block drifts out of the
// close-out, and the ordering pin is an index comparison so renumbering lfg's
// steps does not break it.
//
// The condition is an obligation, never a count. "Skip when none of the N
// exists" lets an agent satisfy the rule from the observable zeroes and never
// perform the judgment -- there is no enumerable trigger set here to count.
// Step 6 is the deliberate contrast: its count is pinned in
// unified-plan-artifact-contract because its triggers are finite and named.
//
// Scope: the pass detects and packages only. A sibling ticket owns classifying
// and filing, so a tracker, queue, or issue-creation instruction appearing in
// this block is a scope regression.
describe("lfg out-of-scope follow-up capture", () => {
  // Anchored on the step pattern, not the literal number, and bounded at the next
  // subsection: an unanchored slice() on a missing index returns the file's last
  // character, which would make the negative pins below pass vacuously.
  const CAPTURE_HEADING = "### Follow-ups the run discovered"
  const closeOutAt = shippingTail.search(/^## Step \d+ — close out$/m)
  const closeOut = closeOutAt > -1 ? shippingTail.slice(closeOutAt) : ""
  const captureAt = closeOut.indexOf(CAPTURE_HEADING)
  const captureEnd = closeOut.indexOf("\n### ", captureAt + CAPTURE_HEADING.length)
  const capture =
    captureAt > -1 ? closeOut.slice(captureAt, captureEnd > -1 ? captureEnd : undefined) : ""

  test("the capture pass lives in the close-out and is reached before the DONE promise", () => {
    expect(closeOutAt, "shipping.md must carry a `## Step <n> — close out` heading").toBeGreaterThan(-1)
    expect(captureAt, "the capture pass must live inside the close-out").toBeGreaterThan(-1)
    expect(capture.length, "the capture slice must not collapse to nothing").toBeGreaterThan(200)

    const donePromise = closeOut.indexOf("Then output the DONE promise.")
    expect(donePromise).toBeGreaterThan(captureAt)
  })

  test("the capture condition is an obligation, not a count over a trigger set", () => {
    expect(capture).toMatch(/Performing this review is unconditional/)
    // Silence is stated as all three omissions; dropping any one of them is how
    // a placeholder creeps back into every run.
    expect(capture).toMatch(/no section, no placeholder, and no "none found" line/)
    // A count here is the regression: observable zeroes plus one unexamined
    // judgment reads as a legitimate skip.
    expect(capture).not.toMatch(/none of the (?:two|three|four|five|N) exists?/i)
  })

  test("each packaged discovery carries the three things a later reader needs", () => {
    // Bolded forms, not the bare words: "description" also occurs in this slice as
    // "description-update mode", so the bare-word pin could not fail when the
    // package bullets were removed (WOR-92 review finding, anchor 100).
    for (const element of ["**description**", "**origin anchor**", "**code pointers**"]) {
      expect(capture, `the package must name ${element}`).toContain(element)
    }
    // The ticket anchor is absent on the plan route, so the order degrades.
    expect(capture).toMatch(/issue of record[\s\S]{0,400}PR URL[\s\S]{0,400}branch and head SHA/)
  })

  test("the capture pass detects and packages only -- it never routes or files", () => {
    expect(capture).toMatch(/neither classifies[\s\S]{0,160}nor files/)
    expect(capture).not.toMatch(/tracker-defer/)
    expect(capture).not.toMatch(/gh issue create/)
    expect(capture).not.toMatch(/intake queue/)
  })

  test("the record keeps its own heading and preserves the review-residual section", () => {
    expect(capture).toContain("## Follow-ups discovered in this run")
    expect(capture).toContain("## Unapplied review findings")
    // Step 9's description-update sentence covers only a pre-existing PR, so the
    // close-out states its own invocation; and that mode recomposes the whole
    // body, which would otherwise reopen a finding ticked closed at step 10.
    expect(capture).toMatch(/description-update mode/)
    expect(capture).toMatch(/current body/)
    // The carry-forward is stated as a condition over everything the recompose
    // drops, not as a list of what this run produced. Round 1 glossed it into
    // such a list and every item was a this-run artifact, so a second run
    // silently erased the first run's discoveries; these two pin the property
    // and the merge direction that replaced the list.
    expect(capture).toMatch(/whether or not this run produced it/)
    expect(capture).toMatch(/an earlier run left[\s\S]{0,120}rather than replace/)
  })

  test("an observation made earlier in the run is noted when it occurs", () => {
    // The capture pass first states itself at step 9, so nothing would preserve
    // a step-3 observation for it without this.
    expect(reviewFollowup).toMatch(/note it in your narration as it occurs/)
  })

  // WOR-92 (2026-11-05): step 9 carried its own copy of the carry-forward rule
  // and it had already drifted -- it named only the capture heading and stated no
  // failure direction, while the owning statement one screen down names both
  // at-risk sections and gates the edit on the body read. Nothing caught the
  // drift because the pins above slice downward from the close-out heading and
  // step 9 sits above that slice, so the more common path (a PR that already
  // existed) was the unpinned one. The rule now has one owner and step 9 points
  // at it, per root CODING_STANDARDS.md "One contract, one owner": a paraphrase
  // sitting next to its owner drifts apart from it.
  test("step 9's description-update invocation defers to the close-out's carry-forward rule", () => {
    const stepNineAt = shippingTail.search(/^## Step \d+ — what LFG passes into the default$/m)
    expect(stepNineAt, "shipping.md must carry a step-9 default-handoff heading").toBeGreaterThan(-1)
    const stepTenAt = shippingTail.search(/^## Step \d+ — stack handoff from step \d+$/m)
    expect(stepTenAt, "shipping.md must carry a step-10 heading after step 9").toBeGreaterThan(stepNineAt)
    const stepNine = shippingTail.slice(stepNineAt, stepTenAt)

    expect(stepNine, "step 9 must point at the carry-forward rule by name").toContain(
      "Follow-ups the run discovered",
    )
    expect(stepNine, "the pointer must say the rule binds every description-update invocation").toMatch(
      /governs every description-update invocation/,
    )
    // The regression this replaces: step 9 restating the rule itself. Its own
    // copy said "pass its live `## Follow-ups discovered in this run` section
    // through unchanged" -- one section, no failure direction.
    expect(stepNine, "step 9 must not restate the carry-forward rule").not.toMatch(/through unchanged/)
  })
})

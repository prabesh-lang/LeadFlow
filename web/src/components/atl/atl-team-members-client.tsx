"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AddAnalystForm, AddMainTeamForm } from "@/components/atl/member-forms";
import { whatsappChatUrl } from "@/lib/whatsapp-url";

export type AnalystRow = {
  id: string;
  name: string;
  email: string;
  analystTeamName: string | null;
  provisioningPassword: string | null;
};
export type TeamRow = {
  id: string;
  name: string;
  mainTeamLead: {
    name: string;
    email: string;
    provisioningPassword: string | null;
  };
  whatsappLines: { id: string; phone: string; label: string | null }[];
};

type ModalType = "analyst" | "mtl" | null;

function IconEyeOpen() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

/** Masked password; `plain` is stored when ATL creates the user (see provisioningPassword). */
function PasswordRevealCell({ plain }: { plain: string | null }) {
  const [visible, setVisible] = useState(false);
  const hasPlain = Boolean(plain && plain.length > 0);

  return (
    <div className="flex min-w-[10rem] max-w-[280px] items-center gap-2">
      <span className="min-w-0 flex-1 text-xs leading-snug">
        {visible ? (
          hasPlain ? (
            <span className="break-all font-mono text-lf-text">{plain}</span>
          ) : (
            <span className="text-lf-muted">
              No password on file for this account (created before tracking or
              changed elsewhere). Use{" "}
              <span className="text-lf-text-secondary">Add member</span> for new users
              to store a visible copy here.
            </span>
          )
        ) : (
          <span
            className={
              hasPlain
                ? "select-none font-mono tracking-[0.2em] text-lf-subtle"
                : "text-lf-subtle"
            }
          >
            {hasPlain ? "••••••••" : "—"}
          </span>
        )}
      </span>
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="shrink-0 rounded-md p-1.5 text-lf-subtle transition hover:bg-slate-100 hover:text-lf-muted"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        {visible ? <IconEyeOff /> : <IconEyeOpen />}
      </button>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-[10vh] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="atl-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-lf-surface p-6 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2
            id="atl-modal-title"
            className="text-lg font-semibold text-lf-text"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-lf-subtle hover:bg-slate-100 hover:text-lf-text"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function AddMemberMenu({
  onPick,
}: {
  onPick: (kind: "analyst" | "mtl") => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handle);
      return () => document.removeEventListener("mousedown", handle);
    }
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-2 rounded-lg bg-lf-accent px-4 py-2.5 text-sm font-semibold text-lf-on-accent shadow-lg shadow-slate-300/30 hover:bg-lf-accent-hover"
      >
        Add member
        <svg
          className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open ? (
        <div
          className="absolute right-0 z-50 mt-2 min-w-[220px] overflow-hidden rounded-xl border border-slate-200 bg-lf-bg py-1 shadow-xl"
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full px-4 py-3 text-left text-sm text-lf-text hover:bg-slate-100"
            onClick={() => {
              onPick("analyst");
              setOpen(false);
            }}
          >
            Lead analyst
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full px-4 py-3 text-left text-sm text-lf-text hover:bg-slate-100"
            onClick={() => {
              onPick("mtl");
              setOpen(false);
            }}
          >
            Main team lead
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function AtlTeamMembersClient({
  analysts,
  teams,
}: {
  analysts: AnalystRow[];
  teams: TeamRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"analyst" | "mtl">("analyst");
  const [modal, setModal] = useState<ModalType>(null);

  const refresh = () => router.refresh();

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-lf-text md:text-3xl">
            Members
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-lf-muted">
            Member directory for lead analysts and main team leads. Full
            pipeline metrics:{" "}
            <Link
              href="/analyst-team-lead/insights"
              className="text-lf-link hover:underline"
            >
              Insights
            </Link>{" "}
            (sidebar) ·{" "}
            <Link
              href="/analyst-team-lead"
              className="text-lf-link hover:underline"
            >
              Dashboard
            </Link>
            .
          </p>
        </div>
        <AddMemberMenu
          onPick={(kind) => {
            setModal(kind);
            if (kind === "analyst") setTab("analyst");
            if (kind === "mtl") setTab("mtl");
          }}
        />
      </header>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-lf-text">Member details</h2>
        <div className="flex gap-1 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setTab("analyst")}
            className={`relative px-4 py-3 text-sm font-medium transition ${
              tab === "analyst"
                ? "text-lf-text after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-lf-link"
                : "text-lf-subtle hover:text-lf-muted"
            }`}
          >
            Lead analysts
            <span className="ml-2 tabular-nums text-xs text-lf-subtle">
              ({analysts.length})
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab("mtl")}
            className={`relative px-4 py-3 text-sm font-medium transition ${
              tab === "mtl"
                ? "text-lf-text after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-lf-link"
                : "text-lf-subtle hover:text-lf-muted"
            }`}
          >
            Main team leads
            <span className="ml-2 tabular-nums text-xs text-lf-subtle">
              ({teams.length})
            </span>
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100 bg-lf-surface">
          {tab === "analyst" ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-lf-bg/50 text-[10px] font-semibold uppercase tracking-wider text-lf-subtle">
                    <th className="px-4 py-3 font-medium">Team</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Password</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analysts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-12 text-center text-lf-subtle"
                      >
                        No lead analysts yet. Use{" "}
                        <span className="text-lf-muted">Add member</span> →
                        Lead analyst.
                      </td>
                    </tr>
                  ) : (
                    analysts.map((a) => (
                      <tr key={a.id} className="text-lf-muted">
                        <td className="px-4 py-3 font-medium text-lf-text-secondary">
                          {a.analystTeamName ?? "—"}
                        </td>
                        <td className="px-4 py-3 font-medium text-lf-text">
                          {a.name}
                        </td>
                        <td className="px-4 py-3">{a.email}</td>
                        <td className="px-4 py-3 align-top">
                          <PasswordRevealCell
                            plain={a.provisioningPassword}
                          />
                        </td>
                        <td className="px-4 py-3 text-xs text-lf-text-secondary">
                          Lead analyst
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-lf-bg/50 text-[10px] font-semibold uppercase tracking-wider text-lf-subtle">
                    <th className="px-4 py-3 font-medium">Team</th>
                    <th className="px-4 py-3 font-medium">WhatsApp</th>
                    <th className="px-4 py-3 font-medium">Main team lead</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Password</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teams.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-12 text-center text-lf-subtle"
                      >
                        No teams yet. Use{" "}
                        <span className="text-lf-muted">Add member</span> → Main
                        team lead.
                      </td>
                    </tr>
                  ) : (
                    teams.map((t) => (
                      <tr key={t.id} className="text-lf-muted">
                        <td className="px-4 py-3 font-medium text-lf-text">
                          {t.name}
                        </td>
                        <td className="px-4 py-3 align-top text-xs">
                          {t.whatsappLines.length === 0 ? (
                            <span className="text-lf-subtle">—</span>
                          ) : (
                            <ul className="max-w-[14rem] space-y-1.5">
                              {t.whatsappLines.map((w) => (
                                <li key={w.id}>
                                  {w.label ? (
                                    <span className="block text-[10px] text-lf-subtle">
                                      {w.label}
                                    </span>
                                  ) : null}
                                  <a
                                    href={whatsappChatUrl(w.phone)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-lf-link hover:text-lf-link-bright hover:underline"
                                  >
                                    {w.phone}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                        <td className="px-4 py-3">{t.mainTeamLead.name}</td>
                        <td className="px-4 py-3">{t.mainTeamLead.email}</td>
                        <td className="px-4 py-3 align-top">
                          <PasswordRevealCell
                            plain={t.mainTeamLead.provisioningPassword}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modal === "analyst" ? (
        <Modal
          title="Add lead analyst"
          onClose={() => setModal(null)}
        >
          <AddAnalystForm
            variant="modal"
            onSuccess={refresh}
          />
        </Modal>
      ) : null}

      {modal === "mtl" ? (
        <Modal
          title="Add main team & team lead"
          onClose={() => setModal(null)}
        >
          <AddMainTeamForm variant="modal" onSuccess={refresh} />
        </Modal>
      ) : null}
    </div>
  );
}

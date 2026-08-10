"use client";

import { Contact } from "./types";

interface RecipientSelectorProps {
  contacts: Contact[];
  filteredContacts: Contact[];
  selectedContactIds: string[];
  search: string;

  inputClasses: string;
  secondaryButtonClasses: string;

  onSearchChange: (value: string) => void;
  onToggleContact: (contactId: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

export default function RecipientSelector({
  filteredContacts,
  selectedContactIds,
  search,
  inputClasses,
  secondaryButtonClasses,
  onSearchChange,
  onToggleContact,
  onSelectAll,
  onClearSelection,
}: RecipientSelectorProps) {
  return (
    <section className="rounded-xl border border-[#EDE7DC] bg-white/40 p-6 backdrop-blur-sm transition-colors duration-300 hover:bg-white/50">
      <div className="mb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7832F]">
          Audience
        </p>

        <h2 className="mt-2 font-serif text-xl font-normal tracking-wide text-[#29231D]">
          Select Contacts
        </h2>

        <div className="mt-2 flex items-center gap-2">
          <span className="inline-flex rounded-full border border-[#D8B66A]/30 bg-[#B7832F]/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#B7832F]">
            {selectedContactIds.length} selected
          </span>
        </div>
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search by name or email..."
        className={inputClasses}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSelectAll}
          className={secondaryButtonClasses}
        >
          Select All Shown
        </button>

        <button
          type="button"
          onClick={onClearSelection}
          className="cursor-pointer rounded-md border border-[#E3DCD0] bg-white/60 px-5 py-3 text-xs font-medium tracking-wide text-[#7C7265] transition-all duration-300 hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-50/70 hover:text-red-700 hover:shadow-sm active:translate-y-0 active:scale-[0.99]"
        >
          Clear Selection
        </button>
      </div>

      <div className="mt-5 max-h-[650px] space-y-2 overflow-y-auto pr-1">
        {filteredContacts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D8CDBE] bg-white/30 p-6 text-center">
            <p className="font-serif text-sm text-[#29231D]">
              No contacts found
            </p>

            <p className="mt-1 text-xs text-[#8F8578]">
              Try changing your search term.
            </p>
          </div>
        ) : (
          filteredContacts.map((contact) => {
            const fullName = [contact.first_name, contact.last_name]
              .filter(Boolean)
              .join(" ");

            const isSelected =
              selectedContactIds.includes(contact.id);

            return (
              <label
                key={contact.id}
                className={`group flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all duration-300 ${
                  isSelected
                    ? "border-[#D8B66A]/60 bg-[#B7832F]/10 shadow-sm"
                    : "border-[#EDE7DC] bg-white/45 hover:-translate-y-0.5 hover:border-[#D8B66A]/40 hover:bg-white/75 hover:shadow-sm"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleContact(contact.id)}
                  className="mt-1 h-4 w-4 accent-[#B7832F]"
                />

                <span className="min-w-0">
                  <span
                    className={`block font-serif text-sm font-medium tracking-wide ${
                      isSelected
                        ? "text-[#916520]"
                        : "text-[#29231D]"
                    }`}
                  >
                    {fullName || "Unnamed Contact"}
                  </span>

                  <span className="mt-1 block truncate text-xs text-[#8F8578]">
                    {contact.email || "No email address"}
                  </span>
                </span>
              </label>
            );
          })
        )}
      </div>
    </section>
  );
}
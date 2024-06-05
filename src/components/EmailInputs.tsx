import { useState, useRef, useEffect, memo, cloneElement } from "react";
import type React from "react";
import classNames from "classnames";

type EmailChip = {
  key: number;
} & EmailData;

type EmailData = {
  email: string;
  valid: boolean;
};

type EmailChipRequired =
  | {
      required: true;
      requiredMessage: string;
    }
  | { required?: false | null; requiredMessage?: null };

type EmailInputProps = {
  limit?: number;
  limitMessage?: string;
  inputId?: string;
  initialEmails?: string[];
  deleteButton?: React.ReactElement;
  placeholder?: string;
  validateEmail?: (email: string) => boolean;
  onChipChange?: (chips: EmailData[]) => void;
} & EmailChipRequired;

const emailChipsToEmailData = (chips: EmailChip[]): EmailData[] => {
  return chips.map((chip) => {
    return { email: chip.email, valid: chip.valid };
  });
};

const EmailChips = ({
  deleteButton,
  initialEmails,
  inputId,
  limit,
  limitMessage,
  onChipChange,
  validateEmail,
  placeholder,
  required,
  requiredMessage,
}: EmailInputProps) => {
  const [chips, setChips] = useState<EmailChip[]>(() => {
    const now = Date.now();
    return (
      initialEmails?.map((email, i) => {
        return { email, valid: true, key: now - i };
      }) ?? []
    );
  });
  const [disableInput, setDisableInput] = useState(false);
  const [requiredValidation, setRequiredValidation] = useState(false);
  const [limitValidation, setLimitValidation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const disable = !!limit && limit <= chips.length;
    setDisableInput(disable);
    setLimitValidation(disable);
  }, [chips.length, limit]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (
    event,
  ) => {
    const keyPressed = event.key;
    if (keyPressed === "Enter") {
      event.preventDefault();
      updateChips();
    } else if (keyPressed === "Backspace") {
      if (!inputRef.current?.value && chips.length) {
        deleteChip(chips[chips.length - 1]);
      }
    }
  };

  const deleteChip = (removedChip: EmailChip | undefined) => {
    if (!removedChip) return;
    if (required && removedChip.valid && isOnlyOneValidChip()) {
      setRequiredValidation(true);
    } else {
      const updatedChips = chips.filter((chip) => chip.key !== removedChip.key);
      setChips(updatedChips);
      onChipChange?.(emailChipsToEmailData(updatedChips));
    }
  };

  const isOnlyOneValidChip = () => {
    return chips.filter((chip) => chip.valid).length <= 1;
  };

  const updateChips = () => {
    if (!inputRef.current) return;
    const value = inputRef.current.value.trim().toLowerCase();
    if (!value) return;
    const chipExists = chips.some((chip) => chip.email === value);
    if (chipExists) {
      inputRef.current.value = "";
      return;
    }
    const valid = validateEmail !== undefined ? validateEmail(value) : true;
    const newChip = { email: value, valid, key: Date.now() };
    const updatedChips = [...chips, newChip];
    if (required && !valid) {
      const validChips = chips.filter((chip) => chip.valid);
      if (validChips.length === 0) {
        setRequiredValidation(true);
      }
    } else {
      setRequiredValidation(false);
    }
    setChips(updatedChips);
    onChipChange?.(emailChipsToEmailData(updatedChips));
    inputRef.current.value = "";
  };

  return (
    <div className="w-full">
      <div
        className="focus-within:ring-primary flex w-full flex-row flex-wrap items-center gap-2 rounded-md border border-gray-300 px-2 py-1 transition-all focus-within:ring-1"
        onClick={() => inputRef.current?.focus()}
      >
        <MemoizedEmailChipsList
          chips={chips}
          deleteButton={deleteButton}
          onChipClick={(event, chip) => {
            event.stopPropagation();
            deleteChip(chip);
          }}
        />
        {!disableInput && (
          <input
            type="text"
            id={inputId}
            className="min-h-[2rem] flex-grow border-none p-0 outline-none ring-0 focus:border-none focus:outline-none focus:ring-0 focus-visible:border-none focus-visible:outline-none focus-visible:ring-0"
            placeholder={placeholder}
            onKeyDown={handleKeyDown}
            onBlur={updateChips}
            ref={inputRef}
          />
        )}
      </div>
      <div className="flex flex-row gap-x-2 px-2 pb-2 text-sm text-gray-500">
        {!!limit && limitValidation && <span>{limitMessage}</span>}
        {required && requiredValidation && <span>{requiredMessage}</span>}
      </div>
    </div>
  );
};

type EmailChipsListProps = {
  chips: EmailChip[];
  deleteButton?: React.ReactElement;
  onChipClick: (event: React.MouseEvent, chip: EmailChip) => void;
};
const EmailChipsList = ({
  chips,
  onChipClick,
  deleteButton,
}: EmailChipsListProps) => {
  return (
    <>
      {chips.map((chip) => (
        <span
          className={classNames(
            "inline-flex items-center rounded-full border border-gray-200 px-2 py-1 text-sm font-medium text-gray-800",
            chip.valid
              ? "border-gray-200 bg-gray-100"
              : "border-red-200 bg-red-100",
          )}
          key={chip.key}
        >
          <span className="max-w-[30ch] truncate">{chip.email}</span>
          {deleteButton ? (
            <ChipDeleteButton
              button={deleteButton}
              chip={chip}
              onClick={onChipClick}
            />
          ) : (
            <button type="button" onClick={(e) => onChipClick(e, chip)}>
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
                data-slot="icon"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </span>
      ))}
    </>
  );
};

const MemoizedEmailChipsList = memo(EmailChipsList);

type ChipDeleteButtonProps = {
  button: React.ReactElement;
  chip: EmailChip;
  onClick: (event: React.MouseEvent, chip: EmailChip) => void;
};
const ChipDeleteButton = ({ button, chip, onClick }: ChipDeleteButtonProps) => {
  const DeleteButton = cloneElement(button, {
    onClick: (e: React.MouseEvent) => onClick(e, chip),
    type: "button",
  });
  return DeleteButton;
};

export default EmailChips;

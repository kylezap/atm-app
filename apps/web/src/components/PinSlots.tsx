interface PinSlotsProps {
  pin: string;
}

export function PinSlots({ pin }: PinSlotsProps) {
  return (
    <div aria-hidden="true" className="pin-slots">
      {Array.from({ length: 4 }, (_, index) => (
        <span className="pin-slot" key={`pin-slot-${index}`}>
          {index < pin.length ? "•" : ""}
        </span>
      ))}
    </div>
  );
}

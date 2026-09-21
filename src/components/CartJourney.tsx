export default function CartJourney({ step }: { step: 1 | 2 | 3 }) {
  return (
    <ol className="cart-journey" aria-label="Checkout progress">
      {["Your edit", "Delivery", "Payment"].map((label, index) => (
        <li
          key={label}
          data-active={index + 1 <= step}
          aria-current={index + 1 === step ? "step" : undefined}
        >
          <span aria-hidden="true">
            {index + 1 < step ? "✓" : `0${index + 1}`}
          </span>
          {label}
        </li>
      ))}
    </ol>
  );
}

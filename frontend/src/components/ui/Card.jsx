function Card({children, className=""}) {
    return (
       <div
      className={`
        w-full
        max-w-[448px]
        rounded-3xl
        border
        border-[rgba(172,178,189,0.1)]
        bg-white
        p-12
        shadow-[0_12px_40px_rgba(76,89,166,0.08)]
        ${className}
      `}
    >
      {children}
    </div>
    );
}

export default Card;
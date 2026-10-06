"use client";

import { motion, useAnimate } from "motion/react";
import React, { useEffect } from "react";

import { cn } from "@/shared/utils/cn";

export type ButtonStatus = "idle" | "loading" | "success";

interface StatefulButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: React.ReactNode;
  status?: ButtonStatus;
}

export const StatefulButton = ({
  className,
  children,
  status = "idle",
  ...props
}: StatefulButtonProps) => {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    if (!scope.current) return;

    if (status === "loading") {
      animate(
        ".loader",
        { width: "20px", scale: 1, display: "block" },
        { duration: 0.2 },
      );
      animate(
        ".check",
        { width: "0px", scale: 0, display: "none" },
        { duration: 0.2 },
      );
    } else if (status === "success") {
      animate(
        ".loader",
        { width: "0px", scale: 0, display: "none" },
        { duration: 0.2 },
      );
      animate(
        ".check",
        { width: "20px", scale: 1, display: "block" },
        { duration: 0.2 },
      );
    } else {
      // idle state reset
      animate(
        ".loader",
        { width: "0px", scale: 0, display: "none" },
        { duration: 0.15 },
      );
      animate(
        ".check",
        { width: "0px", scale: 0, display: "none" },
        { duration: 0.15 },
      );
    }
  }, [status, animate, scope]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (props.disabled) return;
    props.onClick?.(event);
  };

  const {
    onClick,
    onDrag,
    onDragStart,
    onDragEnd,
    onAnimationStart,
    onAnimationEnd,
    ...buttonProps
  } = props;

  return (
    <motion.button
      layout
      layoutId="stateful-button"
      ref={scope}
      className={cn(
        "flex min-w-[140px] cursor-pointer items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white ring-offset-2 transition duration-200 hover:bg-emerald-700 hover:ring-2 hover:ring-emerald-500 active:scale-95 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-black",
        className,
      )}
      {...buttonProps}
      onClick={handleClick}
    >
      <motion.div layout className="flex items-center gap-2">
        <Loader />
        <CheckIcon />
        <motion.span layout>{children}</motion.span>
      </motion.div>
    </motion.button>
  );
};

const Loader = () => {
  return (
    <motion.svg
      animate={{
        rotate: [0, 360],
      }}
      initial={{
        scale: 0,
        width: 0,
        display: "none",
      }}
      style={{
        scale: 0.5,
        display: "none",
      }}
      transition={{
        duration: 0.3,
        repeat: Infinity,
        ease: "linear",
      }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="loader text-white"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 3a9 9 0 1 0 9 9" />
    </motion.svg>
  );
};

const CheckIcon = () => {
  return (
    <motion.svg
      initial={{
        scale: 0,
        width: 0,
        display: "none",
      }}
      style={{
        scale: 0.5,
        display: "none",
      }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="check text-white"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
      <path d="M9 12l2 2l4 -4" />
    </motion.svg>
  );
};

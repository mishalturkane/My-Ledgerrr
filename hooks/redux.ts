// hooks/redux.ts
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/store";

/** Typed dispatch hook — always use this instead of plain useDispatch. */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/** Typed selector hook — always use this instead of plain useSelector. */
export const useAppSelector = <T>(selector: (state: RootState) => T): T =>
  useSelector(selector);

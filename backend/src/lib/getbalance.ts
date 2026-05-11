import { BALANCES} from "../inmemory";
import type { Currency } from "../types/inmemoryTypes";

export function getBalance(currency: Currency, uid: string)
{
    return BALANCES[uid]![currency].available;
}

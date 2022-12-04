type Lookup = { class: string };

type Nodeback<T> = (err: string | null, result: T) => void;

declare module 'node-wmi' {
	export function Query<T>(entry: Lookup, callback: Nodeback<T[]>): void;
}

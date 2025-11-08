// Context7: Reusable form validator factory for Svelte 5
// Encapsulates validation logic with derived state for reactive UI

export interface ValidationRule {
	check: (value: any) => boolean;
	message?: string;
	level?: 'error' | 'warning';
}

export interface FormValidator {
	value: string | number;
	isValid: boolean;
	isDirty: boolean;
	errors: string[];
	warnings: string[];
	touch: () => void;
	reset: () => void;
}

/**
 * Creates a reactive form field validator with derived state
 * @param initialValue - Initial field value
 * @param rules - Array of validation rules
 * @returns Validator object with reactive properties
 */
export function createFieldValidator(
	initialValue: string | number = '',
	rules: ValidationRule[] = []
): FormValidator {
	let value = $state(initialValue);
	let isDirty = $state(false);

	// Context7: Derived validation results
	const errors = $derived.by(() => {
		if (!isDirty) return [];
		return rules
			.filter(r => r.level !== 'warning' && !r.check(value))
			.map(r => r.message || 'Invalid');
	});

	const warnings = $derived.by(() => {
		if (!isDirty) return [];
		return rules
			.filter(r => r.level === 'warning' && !r.check(value))
			.map(r => r.message || 'Warning');
	});

	const isValid = $derived(errors.length === 0);

	return {
		get value() { return value; },
		set value(v: string | number) { value = v; },
		get isValid() { return isValid; },
		get isDirty() { return isDirty; },
		get errors() { return errors; },
		get warnings() { return warnings; },
		touch: () => { isDirty = true; },
		reset: () => {
			value = initialValue;
			isDirty = false;
		}
	};
}

/**
 * Common validation rules for reuse
 */
export const Rules = {
	required: (message = 'Required'): ValidationRule => ({
		check: (v: any) => {
			if (typeof v === 'string') return v.trim().length > 0;
			return v !== null && v !== undefined && v !== '';
		},
		message
	}),

	minLength: (min: number, message?: string): ValidationRule => ({
		check: (v: any) => String(v).length >= min,
		message: message || `Minimum ${min} characters`
	}),

	maxLength: (max: number, message?: string): ValidationRule => ({
		check: (v: any) => String(v).length <= max,
		message: message || `Maximum ${max} characters`
	}),

	email: (message = 'Invalid email'): ValidationRule => ({
		check: (v: any) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)),
		message
	}),

	pattern: (regex: RegExp, message = 'Invalid format'): ValidationRule => ({
		check: (v: any) => regex.test(String(v)),
		message
	}),

	match: (pattern: any, message = 'Does not match'): ValidationRule => ({
		check: (v: any) => v === pattern,
		message
	}),

	// For auth: at least 2 chars, alphanumeric + underscore
	username: (message = 'Use 2+ characters (alphanumeric, underscore)'): ValidationRule => ({
		check: (v: any) => /^[a-zA-Z0-9_]{2,}$/.test(String(v)),
		message
	}),

	// Custom: at least warn at 80%  of max
	lengthWarning: (max: number): ValidationRule => ({
		check: (v: any) => String(v).length <= max,
		message: `Character limit: ${max}`,
		level: 'warning'
	})
};

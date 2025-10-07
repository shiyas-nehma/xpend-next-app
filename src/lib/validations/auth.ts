import { z } from 'zod';

// Login validation schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters long'),
});

// Signup validation schema
export const signupSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Full name must be at least 2 characters long')
    .max(50, 'Full name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Full name can only contain letters, spaces, hyphens, and apostrophes')
    .refine((name) => name.trim().length > 0, 'Full name cannot be empty'),
  email: z
    .string()
    .min(1, 'Email is required')
    .refine((email) => email.trim().length > 0, 'Email cannot be empty')
    .email('Please enter a valid email address (e.g., user@example.com)'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password should include:||At least 6 characters||One uppercase letter||One lowercase letter||One special character')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password should include:||At least 6 characters||One uppercase letter||One lowercase letter||One special character'
    )
    .max(100, 'Password must be less than 100 characters'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// TypeScript types inferred from schemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;

// Validation error type
export interface ValidationErrors {
  [key: string]: string[];
}

// Helper function to format Zod errors
export const formatZodErrors = (error: z.ZodError): ValidationErrors => {
  const formattedErrors: ValidationErrors = {};
  
  if (!error || !error.errors || !Array.isArray(error.errors)) {
    return formattedErrors;
  }
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!formattedErrors[path]) {
      formattedErrors[path] = [];
    }
    formattedErrors[path].push(err.message);
  });
  
  return formattedErrors;
};

// Helper function to get first error for a field
export const getFieldError = (errors: ValidationErrors, fieldName: string): string | undefined => {
  return errors[fieldName]?.[0];
};
-- Add language_preference column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN language_preference text DEFAULT 'en';

-- Add check constraint for valid languages
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_language CHECK (language_preference IN ('en', 'ar'));
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zbhpckqptdeueztfbfef.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiaHBja3FwdGRldWV6dGZiZmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MTcxMzgsImV4cCI6MjA3NDI5MzEzOH0.PXmEtJ4Q2T90aigERZmkpdbprzEl41pJ1amkEHpy4iM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

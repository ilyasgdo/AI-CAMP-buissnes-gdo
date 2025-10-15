import { IsArray, IsOptional, IsString, IsNumber, IsObject } from 'class-validator';

export class CreateProfileDto {
  @IsOptional()
  @IsString()
  user_id?: string;
  @IsString() job: string;
  @IsString() sector: string;
  @IsString() ai_level: string;
  // Autoriser tableau OU objet JSON pour transporter des infos avancées
  @IsOptional()
  tools_used?: any;
  @IsOptional()
  @IsString()
  work_style?: string;

  // Champs avancés (tous optionnels)
  @IsOptional() @IsString() seniority?: string; // Junior, Confirmé, Senior
  @IsOptional() @IsNumber() experience_years?: number;
  @IsOptional() @IsString() company_size?: string; // Startup, PME, Entreprise, Groupe
  @IsOptional() @IsString() preferred_models?: string; // ex: GPT-4o, Gemini 1.5, Llama
  @IsOptional() @IsString() learning_goals?: string; // objectifs pédagogiques
  @IsOptional() @IsNumber() availability_hours_per_week?: number;
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsString() language?: string; // fr, en, etc.
  @IsOptional() @IsString() industries?: string; // domaines supplémentaires
  @IsOptional() @IsString() compliance_needs?: string; // RGPD, HIPAA, etc.
  @IsOptional() @IsString() data_privacy_notes?: string;
  @IsOptional() @IsString() hardware_constraints?: string;
  @IsOptional() @IsString() preferred_workflows?: string;
}
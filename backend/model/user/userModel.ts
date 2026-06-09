export type userModel = {
  user_id: number;
  user_name: string;
  user_account: string | null;
  user_password: string | null;
  user_description: string | null;
  user_role: 'admin' | 'hr' | string | null;
  create_at: Date;
  update_at: Date;
  department_id: number | null;
}

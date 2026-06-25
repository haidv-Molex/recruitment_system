export type departmentModel = {
  department_id: number;
  department_code: string;
  department_name: string;
  department_description: string | null;
  create_at: string | Date;
  update_at: string | Date;
}

export type userModel = {
  user_id: number;
  user_code: string | null;
  user_name: string;
  user_account: string | null;
  user_password: string | null;
  user_description: string | null;
  user_role: 'admin' | 'hr' | 'user' | 'banned' | string | null;
  create_at: string | Date;
  update_at: string | Date;
}

export type userOutputModel = Omit<userModel, 'user_password' | 'user_account'>;

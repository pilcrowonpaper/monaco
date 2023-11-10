import type { Adapter, User, Session } from "@monaco-auth/core";

export class PrismaAdapter implements Adapter {
	private user: PrismaModel<User>;
	private session: PrismaModel<Session>;

	constructor(client: PrismaClient) {
		this.user = client.user;
		this.session = client.session;
	}

	public async getSessionAndUser(
		sessionId: string
	): Promise<[session: Session | null, user: User | null]> {
		const result = await this.session.findUnique<{
			user: User;
		}>({
			where: {
				id: sessionId
			},
			include: {
				user: true
			}
		});
		if (!result) return [null, null];
		const { user, ...session } = result;
		return [session, user];
	}

	public async getUserByOAuthId(oauthId: string): Promise<User | null> {
		return await this.user.findUnique({
			where: {
				oauthId
			}
		});
	}

	public async setUser(user: User): Promise<void> {
		await this.user.create({
			data: user
		});
	}

	public async setSession(session: Session): Promise<void> {
		await this.session.create({
			data: session
		});
	}

	public async deleteSession(sessionId: string): Promise<void> {
		await this.session.deleteMany({
			where: {
				id: sessionId
			}
		});
	}
	public async updateSession(sessionId: string, session: Partial<Session>): Promise<void> {
		await this.session.update({
			data: session,
			where: {
				id: sessionId
			}
		});
	}
}

interface PrismaClient {
	user: any;
	session: any;
	$transaction: any;
}

interface PrismaModel<_Schema extends {}> {
	findUnique: <_Included extends {}>(options: {
		where: Partial<_Schema>;
		include?: Partial<Record<string, boolean>>;
	}) => Promise<null | (_Schema & _Included)>;
	create: (options: { data: _Schema }) => Promise<_Schema>;
	deleteMany: (options: { where: Partial<_Schema> }) => Promise<void>;
	update: (options: { data: Partial<_Schema>; where: Partial<_Schema> }) => Promise<_Schema>;
}

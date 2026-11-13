import React, { memo } from 'react';
import clsx from 'clsx';
import { CachedImage } from '@/components/image';
import Icon from '@/components/icon';
import { Panel } from '@/components/panel';
import type { AccountInfo } from '@/types';

interface AccountCardProps {
	account: AccountInfo | null;
	loggedIn: boolean;
	emptyLabel: string;
}

export const AccountCard: React.FC<AccountCardProps> = memo(({ account, loggedIn, emptyLabel }) => {
	const name = loggedIn ? account?.name || '--' : emptyLabel;
	const uid = loggedIn && account?.uid ? account.uid : '--';

	return (
		<Panel className="relative overflow-hidden">
			<div className="flex items-center gap-3 p-3.5">
				<div className="relative shrink-0">
					{loggedIn && account?.face ? (
						<CachedImage alt={name} className="h-11 w-11 rounded-full object-cover" src={account.face} thumb={44} />
					) : (
						<div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
							<Icon name="bilibili" size={22} />
						</div>
					)}
					<span
						className={clsx(
							'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-content1',
							loggedIn ? 'bg-success' : 'bg-default-300'
						)}
					/>
				</div>
				<div className="min-w-0 flex-1">
					<div className="font-a61 truncate text-[14px] font-semibold leading-tight text-foreground">{name}</div>
					<div className="mt-1 font-mono text-[11px] leading-none text-default-400">UID {uid}</div>
				</div>
				<Icon className="shrink-0 text-primary/10" name="bilibili" size={26} />
			</div>
		</Panel>
	);
});

export default AccountCard;

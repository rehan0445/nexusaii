import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import CharacterCard from "./CharacterCard";

interface Character {
	name: string;
	role?: string;
	image: string;
}

interface CharacterEndlessFeedProps {
	characters: Record<string, Character>;
	favorites: string[];
	toggleFavorite: (e: React.MouseEvent, slug: string) => void;
	characterLikes: Record<string, { likeCount: number; userLiked: boolean }>;
	handleLike: (e: React.MouseEvent, slug: string) => void;
	likeLoading: Record<string, boolean>;
	title?: string;
	subtitle?: string;
}

const BATCH_SIZE = 12;

export default function CharacterEndlessFeed({
	characters,
	favorites,
	toggleFavorite,
	characterLikes,
	handleLike,
	likeLoading,
	title = "All AI Characters",
	subtitle = "Discover AI characters created by the community",
}: Readonly<CharacterEndlessFeedProps>) {
	const navigate = useNavigate();
	const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
	const sentinelRef = useRef<HTMLDivElement | null>(null);

	const entries = useMemo(() => Object.entries(characters), [characters]);
	const visibleEntries = useMemo(() => entries.slice(0, visibleCount), [entries, visibleCount]);

	useEffect(() => {
		if (!sentinelRef.current) return;
		const observer = new IntersectionObserver(
			(entriesObs) => {
				if (entriesObs[0].isIntersecting) {
					setVisibleCount((prev) => (prev + BATCH_SIZE <= entries.length ? prev + BATCH_SIZE : entries.length));
				}
			},
			{ threshold: 0.1 }
		);
		observer.observe(sentinelRef.current);
		return () => observer.disconnect();
	}, [entries.length]);

	if (entries.length === 0) {
		return null;
	}

	return (
		<div className="mb-12">
			<div className="flex items-center justify-between mb-6">
				<div className="flex flex-col">
					<h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
					{subtitle && <p className="text-zinc-400">{subtitle}</p>}
				</div>
				<div className="text-sm text-zinc-400">{entries.length} characters</div>
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
				{visibleEntries.map(([slug, character]) => (
					<CharacterCard
						key={slug}
						character={character}
						slug={slug}
						favorites={favorites}
						onToggleFavorite={toggleFavorite}
						onCharacterClick={(slug) => navigate(`/character/${slug}`)}
						likes={characterLikes[slug]?.likeCount || 0}
						onLike={handleLike}
						likeLoading={likeLoading[slug]}
					/>
				))}
			</div>

			{/* Sentinel for infinite loading */}
			<div ref={sentinelRef} className="h-8" />
		</div>
	);
}

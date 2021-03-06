// This file is part of docts, copyright (c) 2016 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import * as fs from 'fs';
import * as Promise from 'bluebird';

/** Represents a section in a Markdown file. */

export class Section {
	/** Heading and its markup split by newlines.
	  * Heading is a line beginning with # or followed by another line full of - or =. */
	header: string[] = [];
	/** Section content split by newlines. */
	content: string[] = [];
	/** Heading with markup stripped. */
	name: string;
}

/** Represents a Markdown file. */

export class Markdown {
	constructor(markdownPath: string) {
		this.path = markdownPath;
	}

	/** Read the file and split each heading into a separate section. */

	readSections() {
		var lineList = fs.readFileSync(this.path, { encoding: 'utf8' }).split(/\r?\n/);
		var sectionList: Section[] = [];
		var section = new Section();
		var prev: string = null;

		for(var line of lineList) {
			if(line.match(/^ *[-=]{2,} *$/)) {
				sectionList.push(section);
				section = new Section();

				if(prev) {
					section.header.push(prev);
					section.header.push(line);
					section.name = prev.trim().toLowerCase();
				}
				line = null;
			} else {
				if(prev || prev === '') section.content.push(prev);

				var match = line.match(/^ *#{1,6} *([^ #]+)/);

				if(match) {
					sectionList.push(section);
					section = new Section();

					section.header.push(line);
					section.name = match[1].trim().toLowerCase();
					line = null;
				}
			}

			prev = line;
		}

		if(prev || prev === '') section.content.push(prev);
		sectionList.push(section);

		return(sectionList);
	}

	/** Replace file contents with a new list of sections. */

	writeSections(sectionList: Section[]): Promise<void> {
		var output = Array.prototype.concat.apply([], sectionList.map(
			(section: Section) => section.header.concat(section.content)
		)).join('\n');

		var writeFile = Promise.promisify(fs.writeFile as (path: string, data: string, options: any, cb: any) => void);

		return(writeFile(this.path, output, { encoding: 'utf8' }) as Promise<any>);
	}

	path: string;
}

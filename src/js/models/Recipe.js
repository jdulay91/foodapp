import axios from 'axios';
import { elements } from '../views/base';

export default class Recipe {
	constructor(id) {
		this.id = id;
	}

	async getRecipe() {
		try {
			const res = await axios(`https://forkify-api.herokuapp.com/api/get?rId=${this.id}`);
			this.title = res.data.recipe.title;
			this.author = res.data.recipe.publisher;
			this.img = res.data.recipe.image_url;
			this.url = res.data.recipe.source_url;
			this.ingredients = res.data.recipe.ingredients;
		} catch (err) {
			alert('Something went wrong😭', err);
		}
	}

	calcTime() {
		//assumptions that we need 15mins for every 3 ingredients
		const numIng = this.ingredients.length;
		const periods = Math.ceil(numIng / 3);
		this.time = periods * 15;
	}

	calcServings() {
		this.servings = 4;
	}

	parseIngredients() {
		const unitsLong = ['tablespoons', 'tablespoon', 'ounces', 'ounce', 'teaspons', 'teaspoon', 'cups', 'pounds'];
        const unitsShort = ['tbsp', 'tbsp', 'oz', 'oz', 'tsp', 'tsp', 'cup', 'pound'];
        const units = [...unitsShort,'kg','g']        
		const newIngredients = this.ingredients.map((element) => {
			let ingredient = element.toLowerCase();
			unitsLong.forEach((unit, i) => {
				ingredient = ingredient.replace(unit, unitsShort[i]);
            });            
            //remove parens
            ingredient = ingredient.replace(/ *\([^)]*\) */g, ' ');
            
            //parse ingredients into count, unit and ingredient
			const ingredientArr = ingredient.split(' ');
			const unitIndex = ingredientArr.findIndex((element2) => units.includes(element2));

			let objIngr;
			if (unitIndex > -1) {
				//unit is truthy
				const arrCount = ingredientArr.slice(0, unitIndex);
				// ex. 4 1/2 cups, arrCount will be [4, 1/2]
				let count;
				if (arrCount.length === 1) {
					count = eval(ingredientArr[0].replace('-', '+'));
				} else {
					count = eval(ingredientArr.slice(0, unitIndex).join('+'));
				}

				objIngr = {
					count,
					unit: ingredientArr[unitIndex],
					ingredient: ingredientArr.slice(unitIndex + 1).join(' ')
				};
			} else if (parseInt(ingredientArr[0], 10)) {
				//there is no unit but 1st element is a number
				objIngr = {
					count: parseInt(ingredientArr[0], 10),
					unit: '',
					ingredient: ingredientArr.slice(1).join(' ')
				};
			} else if (unitIndex === -1) {
				// no unit and no number in 1st position
				objIngr = {
					count: 1,
					unit: '',
					ingredient
				};
			}

			return objIngr;
		});
		this, (this.ingredients = newIngredients);
	}

	updateServings (type) {
		//updates servings
		const newServings = type === 'dec' ? this.servings -1 : this.servings + 1;

		//update ingredients
		this.ingredients.forEach(ingredient => {
			ingredient.count *= (newServings/this.servings)
		})
		
		this.servings= newServings
	
	}
}

// Global app controller
import Search from './models/Search'
import Recipe from './models/Recipe'
import List from './models/List'
import Likes from './models/Likes'
import * as searchView from './views/searchView'
import * as recipeView from './views/recipeView'
import * as listView from './views/listView'
import * as likesView from './views/likesView'
import { elements, renderLoader, clearLoader } from './views/base'

/** Global State of the app
 * -Search Object
 * -Current Recipe Object
 * -Shopping List Object
 * -Liked Recipes
 */

const state = {}


/////////////////SEARCH CONTROLLER
const controlSearch = async () => {
    // Get Query From View
    const query = searchView.getInput()
    
    if(query) {
        // New Search Object and Add to state
        state.search = new Search(query);
        //3) Prepare UI for results
        searchView.clearInput()
        searchView.clearResults()
        renderLoader(elements.searchRes)
        try{
        //4) Search for recipes
        await state.search.getResults()
        //5) Render results on UI
        clearLoader()
        searchView.renderResults(state.search.results)        
        }catch(err){
            alert('Error error with the search...')
            clearLoader()
        }
    }
}

elements.searchForm.addEventListener('submit', e=>{
    e.preventDefault();
    controlSearch()
});


elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline')
    if(btn) {
        const goToPage = parseInt(btn.dataset.goto, 10)
        searchView.clearResults()
        searchView.renderResults(state.search.results,goToPage)       
    }
})

/////////RECIPE CONTROLLER//////

const controlRecipe = async () => {
    const id = window.location.hash.replace('#', '')

    if(id){
        //prepare ui for changes
        recipeView.clearRecipe()
        renderLoader(elements.recipe)

        //highlight selected search item
       if(state.search){searchView.highlightSelected(id)}

        //set state
        state.recipe = new Recipe(id)

        try{
            //get recipe data and parse ingredient
            await state.recipe.getRecipe()            
            //parse recipe and rewrites it so its uniform
            state.recipe.parseIngredients()    
             
            //calculate recipe time
            state.recipe.calcTime()
            state.recipe.calcServings()
            
            //render recipe
            clearLoader()
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
            )            

        } catch (err) {
            console.log(err)
        }
    }
}

['hashchange','load'].forEach(event => window.addEventListener(event,controlRecipe))

/////////////LIST CONTROLLER
const controlList = () => {
    //create new list if there is none yet
    if(!state.list) state.list = new List();
    //Add ingredients to list and user interface
    state.recipe.ingredients.forEach(ingredient=>{
        const item = state.list.addItem(ingredient.count,ingredient.unit,ingredient.ingredient)
        listView.renderItem(item)
    })
}

//handle delete and update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid
    //handle delete event
    if(e.target.matches('.shopping__delete, .shopping__delete *')) {
        //delete on state and UI
        state.list.deleteItem(id);
        listView.deleteItem(id)

        //handles update count
    }else if (e.target.matches('.shopping__count-value')){
        
        const value = parseFloat(e.target.value, 10)              
                state.list.updateCount(id, value)         
              
             
    }
    
})
///TESTING

//////////////////////////LIKE CONTROLLER/////////////
const controlLike = () => {
    if(!state.likes) state.likes = new Likes()
        const currentID = state.recipe.id;

        //user has not yet liked current recipe
    if(!state.likes.isLiked(currentID)) {
        //add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img            
        )

        //toggle the like button
        likesView.toggleLikeButton(true)

        //add like to the UI list
        likesView.renderLike(newLike)
        
        //user has liked current recipe
    }else{
        //remove like from state
        state.likes.deleteLike(currentID)

        //toggle the like button
        likesView.toggleLikeButton(false)

        //remove like from the UI list
        likesView.deleteLike(currentID)
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes())
}

/////Restore liked recipes on page load
window.addEventListener('load', ()=> {
    
    state.likes = new Likes();
    //restore likes
    state.likes.readStorage();
    //toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes())
    // render existing likes
    state.likes.likes.forEach(like =>likesView.renderLike(like))

})


//handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if(e.target.matches('.btn-decrease, .btn-decrease *')){
        if(state.recipe.servings > 1){
            state.recipe.updateServings('dec')
            recipeView.updateServingsIngredients(state.recipe)
        }
        //decrease button has been clicked        
    }else if(e.target.matches('.btn-increase, .btn-increase *')){
        //increase button has been clicked
        state.recipe.updateServings('inc')
        recipeView.updateServingsIngredients(state.recipe)

    }else if(e.target.matches('.recipe__btn--add, .recipe__btn--add *')){
        controlList()
    }else if (e.target.matches('.recipe__love, .recipe__love *')){
        controlLike()
    }    
})

